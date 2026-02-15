from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    avatar = serializers.ImageField(source='profile.avatar', required=False, allow_null=True)
    location = serializers.CharField(source='profile.location', read_only=True)
    is_subscribed = serializers.BooleanField(source='profile.is_subscribed', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'avatar', 'location', 'is_subscribed']
        extra_kwargs = {
            'email': {'required': False},
        }

    def get_role(self, obj):
        if obj.is_superuser:
            return 'superadmin'
        if obj.is_staff:
            return 'mitra'
        return 'cashier'

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        role = self.initial_data.get('role', 'cashier')
        # Avatar is handled via signal, but if passed?
        # Typically register logic is simple.
        
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
        
        if role == 'superadmin':
            user.is_superuser = True
            user.is_staff = True
        elif role == 'mitra':
            user.is_staff = True
        
        user.save()
        return user

    def update(self, instance, validated_data):
        # Handle avatar separately because it's on the profile
        profile_data = validated_data.pop('profile', {}) 
        avatar = profile_data.get('avatar')
        
        password = validated_data.pop('password', None)
        role = self.initial_data.get('role', None)
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        if role:
            if role == 'superadmin':
                instance.is_superuser = True
                instance.is_staff = True
            elif role == 'mitra':
                instance.is_superuser = False
                instance.is_staff = True
            elif role == 'cashier':
                instance.is_superuser = False
                instance.is_staff = False
        
        instance.save()

        # Update Profile fields (Avatar)
        if avatar:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            profile.avatar = avatar
            profile.save()
                
        return instance
