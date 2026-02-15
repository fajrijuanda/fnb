from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .serializers import UserSerializer
from .models import UserProfile
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
        if user.is_staff: # Mitra
             return User.objects.filter(profile__owner=user).union(User.objects.filter(id=user.id))
        return User.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        
        # Extra fields handled outside serializer.save() if needed, 
        # but serializer.save() calls create() in serializer.
        # We pass context or rely on serializer's create method.
        
        # Logic is better placed in Serializer.create or here.
        # Let's rely on Serializer.create, but we need to pass the request user.
        serializer.save(created_by=user)

class CustomLoginView(ObtainAuthToken):
    """
    Custom Login View to return User Role along with Token
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Determine Role
        role = 'cashier'
        if user.is_superuser:
            role = 'superadmin'
        elif user.is_staff:
            role = 'mitra'
            
        # Get subscription status
        # Update logic: Check direct profile OR owner's profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        is_subscribed = False
        if profile.is_subscribed:
            is_subscribed = True
        elif profile.owner and profile.owner.profile.is_subscribed:
            is_subscribed = True
        elif user.is_superuser:
            is_subscribed = True

        return Response({
            'status': 'success',
            'data': {
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed,
                'owner_id': profile.owner.id if profile.owner else None
            },
            'message': 'Login successful'
        })

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = 'cashier'
        if user.is_superuser:
            role = 'superadmin'
        elif user.is_staff:
            role = 'mitra'
            
        # Get subscription status
        profile, _ = UserProfile.objects.get_or_create(user=user)
        is_subscribed = False
        if profile.is_subscribed:
            is_subscribed = True
        elif profile.owner and profile.owner.profile.is_subscribed:
            is_subscribed = True
        elif user.is_superuser:
            is_subscribed = True

        return Response({
            'status': 'success',
            'data': {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed,
                'owner_id': profile.owner.id if profile.owner else None,
                'location': profile.location
            }
        })
