from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .serializers import UserSerializer
from .models import UserProfile

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Restrict standard users to only see themselves or limited data if needed
        # For now, admin sees all, others might need restriction
        return User.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data
        })

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
        profile, _ = UserProfile.objects.get_or_create(user=user)
        is_subscribed = profile.is_subscribed or user.is_superuser

        return Response({
            'status': 'success',
            'data': {
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed
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
        is_subscribed = profile.is_subscribed or user.is_superuser

        return Response({
            'status': 'success',
            'data': {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_subscribed': is_subscribed
            }
        })
