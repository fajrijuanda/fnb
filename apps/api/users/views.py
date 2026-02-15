from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .serializers import UserSerializer

from subscriptions.models import Subscription
from django.utils import timezone
from django.db import transaction

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        
        # Mitra can only see their own employees (cashiers) and themselves
        if hasattr(user, 'mitra_profile'):
             from django.db.models import Q
             return User.objects.filter(Q(cashier_profile__mitra=user.mitra_profile) | Q(id=user.id))
        
        # Cashier sees nothing (or just themselves?)
        if hasattr(user, 'cashier_profile'):
             return User.objects.filter(id=user.id)
             
        return User.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)

from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class CustomLoginView(ObtainAuthToken):
    """
    Custom Login View to return User Role along with Token
    """
    throttle_classes = [LoginRateThrottle]
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Determine Role & Subscription
        role = 'cashier'
        is_subscribed = False
        owner_id = None
        
        if user.is_superuser:
            role = 'superadmin'
            is_subscribed = True
            
        elif hasattr(user, 'mitra_profile'):
            role = 'mitra'
            # Check subscription
            if Subscription.objects.filter(user=user, status='active', end_date__gte=timezone.now().date()).exists():
                is_subscribed = True
                
        elif hasattr(user, 'cashier_profile'):
            role = 'cashier'
            mitra_user = user.cashier_profile.mitra.user
            owner_id = mitra_user.id
            # Check owner's subscription
            if Subscription.objects.filter(user=mitra_user, status='active', end_date__gte=timezone.now().date()).exists():
                is_subscribed = True
                
        # Basic profile for avatar
        # profile, _ = UserProfile.objects.get_or_create(user=user) # Signal handles this

        return Response({
            'status': 'success',
            'data': {
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed,
                'owner_id': owner_id
            },
            'message': 'Login successful'
        })

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
