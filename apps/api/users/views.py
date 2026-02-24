from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .serializers import UserSerializer, LoginAttemptSerializer, TrustedDeviceSerializer
from .models import UserSession, TrustedDevice, LoginAttempt
from rest_framework.throttling import AnonRateThrottle

from subscriptions.models import Subscription
from django.utils import timezone
from django.db import transaction


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = User.objects.select_related(
            'mitra_profile', 'cashier_profile', 'cashier_profile__mitra', 'profile'
        )

        # 1. Apply Filtering (allowed for everyone within their scope)
        role = self.request.query_params.get('role')
        if role == 'mitra':
            base_qs = base_qs.filter(mitra_profile__isnull=False)
        elif role == 'cashier':
             base_qs = base_qs.filter(cashier_profile__isnull=False)
        elif role == 'superadmin':
             base_qs = base_qs.filter(is_superuser=True)

        # 2. Apply Permission/Scope Restrictions
        if user.is_superuser:
            return base_qs.order_by('-date_joined')
        
        # Mitra can only see their own employees (cashiers) and themselves
        if hasattr(user, 'mitra_profile'):
             from django.db.models import Q
             return base_qs.filter(Q(cashier_profile__mitra=user.mitra_profile) | Q(id=user.id))
        
        # Cashier sees nothing (or just themselves?)
        if hasattr(user, 'cashier_profile'):
             return base_qs.filter(id=user.id)
             
        return User.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)



class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class CustomLoginView(ObtainAuthToken):
    """
    Custom Login View with Device Management & Concurrent Login Prevention.
    """
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        device_id = request.data.get('device_id')
        device_name = request.data.get('device_name', 'Unknown Device')
        ip_address = self.get_client_ip(request)

        if not device_id:
            return Response({'status': 'error', 'message': 'Device ID is required'}, status=400)

        # Check existing session
        try:
            session = UserSession.objects.get(user=user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(user=user)

        # Check if user is online (activity within last 5 minutes)
        is_online = (timezone.now() - session.last_activity).total_seconds() < 300 and session.is_online
        
        # If online on DIFFERENT device
        if is_online and str(session.active_device_id) != str(device_id):
            # Check if this device is trusted
            try:
                # If trusted, allow login and kick old session
                TrustedDevice.objects.get(user=user, device_id=device_id)
            except TrustedDevice.DoesNotExist:
                # Not trusted: Require approval
                # Create pending login attempt
                attempt = LoginAttempt.objects.create(
                    user=user,
                    device_id=device_id,
                    device_name=device_name,
                    ip_address=ip_address,
                    status='PENDING',
                    expires_at=timezone.now() + timezone.timedelta(minutes=5)
                )
                return Response({
                    'status': 'pending_approval',
                    'message': 'Akun sedang aktif di perangkat lain. Menunggu persetujuan...',
                    'data': {
                        'attempt_id': str(attempt.id),
                        'expires_in': 300
                    }
                }, status=202)

        # Allow Login (Update Session)
        session.active_device_id = device_id
        session.is_online = True
        session.save()

        # Update or Create TrustedDevice entry (update last_used)
        TrustedDevice.objects.get_or_create(
            user=user, 
            device_id=device_id,
            defaults={'device_name': device_name, 'ip_address': ip_address}
        )
        
        # Generate JWT Tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Determine Role & Subscription (Same as before)
        role = 'cashier'
        is_subscribed = False
        owner_id = None
        
        if user.is_superuser:
            role = 'superadmin'
            is_subscribed = True
        elif hasattr(user, 'mitra_profile'):
            role = 'mitra'
            if Subscription.objects.filter(user=user, status='active', end_date__gte=timezone.now().date()).exists():
                is_subscribed = True
        elif hasattr(user, 'cashier_profile'):
            role = 'cashier'
            mitra_user = user.cashier_profile.mitra.user
            owner_id = mitra_user.id
            if Subscription.objects.filter(user=mitra_user, status='active', end_date__gte=timezone.now().date()).exists():
                is_subscribed = True

        return Response({
            'status': 'success',
            'data': {
                'access': access_token,
                'refresh': refresh_token,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed,
                'owner_id': owner_id
            },
            'message': 'Login successful'
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class LoginAttemptView(APIView):
    """
    Manage Login Attempts: Check status (Polling), Approve, Reject.
    """
    permission_classes = [AllowAny] # For polling status (unauthenticated)

    def get(self, request, attempt_id):
        """Poll status of a login attempt"""
        try:
            attempt = LoginAttempt.objects.get(id=attempt_id)
            if attempt.status == 'APPROVED':
                 # If approved, generate token and return Login Success response
                 # Need to mimic login success... logic duplicated?
                 # Or just return status 'APPROVED' and let frontend call login again?
                 # Better: Return token here directly if approved.
                 
                 user = attempt.user

                 refresh = RefreshToken.for_user(user)
                 access_token = str(refresh.access_token)
                 refresh_token = str(refresh)
                 
                 # Prepare Login Data (simplified)
                 role = 'cashier'
                 if user.is_superuser:
                     role = 'superadmin'
                 elif hasattr(user, 'mitra_profile'):
                     role = 'mitra'
                 
                 # Update Session
                 try:
                     session = UserSession.objects.get(user=user)
                     session.active_device_id = attempt.device_id
                     session.is_online = True
                     session.save()
                 except UserSession.DoesNotExist:
                     pass

                 # Add to Trusted Devices automatically upon approval
                 TrustedDevice.objects.get_or_create(
                    user=user, 
                    device_id=attempt.device_id,
                    defaults={'device_name': attempt.device_name, 'ip_address': attempt.ip_address}
                )

                 return Response({
                     'status': 'success',
                     'data': {
                        'access': access_token,
                        'refresh': refresh_token,
                        'user_id': user.pk,
                        'username': user.username,
                        'role': role,
                     }
                 })
            
            elif attempt.status == 'REJECTED':
                return Response({'status': 'rejected'}, status=403)
            elif attempt.status == 'EXPIRED':
                return Response({'status': 'expired'}, status=408)
            
            return Response({'status': 'pending'})

        except LoginAttempt.DoesNotExist:
            return Response({'status': 'error', 'message': 'Invalid attempt ID'}, status=404)


class ApproveLoginView(APIView):
    """
    Active user approves/rejects a pending login request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        attempt_id = request.data.get('attempt_id')
        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        
        if not attempt_id or action not in ['APPROVE', 'REJECT']:
            return Response({'status': 'error', 'message': 'Invalid parameters'}, status=400)

        try:
            attempt = LoginAttempt.objects.get(id=attempt_id, user=request.user, status='PENDING')
            if action == 'APPROVE':
                attempt.status = 'APPROVED'
            else:
                attempt.status = 'REJECTED'
            attempt.save()
            
            return Response({'status': 'success', 'message': f'Login request {action.lower()}d'})
        except LoginAttempt.DoesNotExist:
            return Response({'status': 'error', 'message': 'Request not found or already processed'}, status=404)
            

class PendingLoginsView(APIView):
    """
    List pending login attempts for the active user (for Polling notification).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = LoginAttempt.objects.filter(
            user=request.user, 
            status='PENDING',
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        serializer = LoginAttemptSerializer(attempts, many=True)
        return Response({'status': 'success', 'data': serializer.data})


class DeviceManagementView(APIView):
    """
    List and Delete Trusted Devices.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        devices = TrustedDevice.objects.filter(user=request.user).order_by('-last_used')
        serializer = TrustedDeviceSerializer(devices, many=True)
        return Response({'status': 'success', 'data': serializer.data})
    
    def delete(self, request, pk):
        try:
            device = TrustedDevice.objects.get(id=pk, user=request.user)
            device.delete()
            return Response({'status': 'success', 'message': 'Device removed'})
        except TrustedDevice.DoesNotExist:
             return Response({'status': 'error', 'message': 'Device not found'}, status=404)


class HeartbeatView(APIView):
    """
    Update user session activity and online status.
    Called periodically by frontend.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            session = UserSession.objects.get(user=request.user)
            session.last_activity = timezone.now()
            session.is_online = True
            
            # Verify if this device is still the valid one
            header_device_id = request.headers.get('X-Device-ID')
            if header_device_id and str(session.active_device_id) != header_device_id:
                return Response({'status': 'force_logout'}, status=401)
                
            session.save()
            return Response({'status': 'success'})
        except UserSession.DoesNotExist:
            return Response({'status': 'error'}, status=404)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        role = 'cashier'
        is_subscribed = False
        owner_id = None
        location = None
        
        if user.is_superuser:
            role = 'superadmin'
            is_subscribed = True
            
        elif hasattr(user, 'mitra_profile'):
            role = 'mitra'
            location = user.mitra_profile.location
            if Subscription.objects.filter(user=user, status='active', end_date__gte=timezone.now().date()).exists():
                is_subscribed = True
                
        elif hasattr(user, 'cashier_profile'):
            role = 'cashier'
            mitra = user.cashier_profile.mitra
            owner_id = mitra.user.id
            location = mitra.location
            if Subscription.objects.filter(user=mitra.user, status='active', end_date__gte=timezone.now().date()).exists():
                is_subscribed = True

        return Response({
            'status': 'success',
            'data': {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed,
                'owner_id': owner_id,
                'location': location
            }
        })

# Triggering Deployment
