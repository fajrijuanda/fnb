from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile
from subscriptions.models import Subscription
from django.utils import timezone
from datetime import timedelta

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    avatar = serializers.ImageField(source='profile.avatar', required=False, allow_null=True)
    location = serializers.CharField(source='profile.location', required=False, allow_null=True)
    is_subscribed = serializers.SerializerMethodField()
    plan_name = serializers.CharField(write_only=True, required=False)
    owner_id = serializers.IntegerField(source='profile.owner.id', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'avatar', 'location', 'is_subscribed', 'plan_name', 'owner_id']
        extra_kwargs = {
            'email': {'required': False},
        }

    def get_is_subscribed(self, obj):
        if hasattr(obj, 'profile') and obj.profile.is_subscribed:
            return True
        if hasattr(obj, 'profile') and obj.profile.owner and obj.profile.owner.profile.is_subscribed:
            return True
        return False
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Add role to representation
        if instance.is_superuser:
            ret['role'] = 'superadmin'
        elif instance.is_staff:
            ret['role'] = 'mitra'
        else:
            ret['role'] = 'cashier'
        return ret

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        role = validated_data.pop('role', 'cashier')
        plan_name = validated_data.pop('plan_name', None)
        created_by = validated_data.pop('created_by', None) # Passed from view

        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        
        # Set Roles
        if role == 'superadmin':
            user.is_superuser = True
            user.is_staff = True
        elif role == 'mitra':
            user.is_staff = True
            user.is_superuser = False
        else: # cashier
            user.is_staff = False
            user.is_superuser = False
            
        user.save()
        
        # Profile creation
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Handle Location
        if 'location' in profile_data:
            profile.location = profile_data['location']
            
        # Handle Owner & Logic
        # If created by Mitra, set owner to Mitra
        if created_by and created_by.is_staff and not created_by.is_superuser:
            profile.owner = created_by
            # Inherit location if not provided (though logic says Mitra manages cashiers)
            if not profile.location:
                profile.location = created_by.profile.location
        
        # Handle Subscription logic for New Mitra
        if role == 'mitra' and plan_name:
            profile.is_subscribed = True
            # Create subscription
            Subscription.objects.create(
                user=user,
                plan_name=plan_name,
                status='active',
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=30)
            )
            
        profile.save()
        return user
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
        instance.save()
        
        # Update Profile fields
        profile = instance.profile
        if 'location' in profile_data:
            profile.location = profile_data['location']
        profile.save()
        
        return instance


