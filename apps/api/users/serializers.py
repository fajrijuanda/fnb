import json
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Mitra, Cashier, TrustedDevice, LoginAttempt
from subscriptions.models import Subscription
from django.utils import timezone
from datetime import timedelta

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    avatar = serializers.ImageField(source='profile.avatar', required=False, allow_null=True)
    location = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    payment_info = serializers.SerializerMethodField()
    # owner_id = serializers.IntegerField(source='profile.owner.id', read_only=True) # Deprecated

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'avatar', 'location', 'is_subscribed', 'plan_name', 'date_joined', 'payment_info']
        extra_kwargs = {
            'email': {'required': False},
        }

    def get_location(self, obj):
        try:
            return obj.mitra_profile.location
        except Mitra.DoesNotExist:
            pass
        try:
            return obj.cashier_profile.mitra.location
        except Cashier.DoesNotExist:
            pass
        return None

    def get_is_subscribed(self, obj):
        # Check own subscription (Mitra)
        if Subscription.objects.filter(user=obj, status='active', end_date__gte=timezone.now().date()).exists():
            return True
        # Check owner's subscription (Cashier)
        try:
            owner = obj.cashier_profile.mitra.user
            if Subscription.objects.filter(user=owner, status='active', end_date__gte=timezone.now().date()).exists():
                return True
        except Cashier.DoesNotExist:
            pass
        # Superadmin fallback
        if obj.is_superuser:
            return True
        return False

    def get_plan_name(self, obj):
        try:
            obj.mitra_profile  # Check if mitra
            sub = Subscription.objects.filter(user=obj).order_by('-end_date').first()
            return sub.plan_name if sub else 'No Plan'
        except Mitra.DoesNotExist:
            return None

    def get_payment_info(self, obj):
        try:
            mitra = obj.mitra_profile
        except Mitra.DoesNotExist:
            try:
                mitra = obj.cashier_profile.mitra
            except Cashier.DoesNotExist:
                return None
        
        return {
            'qris_image': mitra.qris_image.url if mitra.qris_image else None,
            'qris_data': mitra.qris_data,
        }
        
    def get_role(self, obj):
        if obj.is_superuser:
            return 'superadmin'
        try:
            obj.mitra_profile
            return 'mitra'
        except Mitra.DoesNotExist:
            pass
        try:
            obj.cashier_profile
            return 'cashier'
        except Cashier.DoesNotExist:
            pass
        # Fallback for old data or incomplete users
        if obj.is_staff: 
            return 'mitra'
        return 'cashier'

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {}) # location might come in here from frontend
        role = self.initial_data.get('role', 'cashier')
        plan_name = validated_data.pop('plan_name', None)
        created_by = validated_data.pop('created_by', None) # Passed from view context

        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        
        # UserProfile is created by signal, but we can set avatar if needed
        # We rely on signal for basic profile.
        
        # Set Roles & Create Specific Profiles
        if role == 'superadmin':
            user.is_superuser = True
            user.is_staff = True
            user.save()
            
        elif role == 'mitra':
            user.is_staff = True
            user.is_superuser = False
            user.save()
            
            # Create Mitra Profile
            location = profile_data.get('location') # or from root validated_data if moved
            if not location and 'location' in self.initial_data:
                 location = self.initial_data.get('location')
                 
            Mitra.objects.create(user=user, location=location)

            # Handle Subscription logic for New Mitra
            if plan_name:
                Subscription.objects.create(
                    user=user,
                    plan_name=plan_name,
                    status='active',
                    start_date=timezone.now().date(),
                    end_date=timezone.now().date() + timedelta(days=30)
                )

        else: # cashier
            user.is_staff = False
            user.is_superuser = False
            user.save()
            
            # Create Cashier Profile
            # Must link to a Mitra. `created_by` should be the Mitra user.
            if created_by and hasattr(created_by, 'mitra_profile'):
                Cashier.objects.create(user=user, mitra=created_by.mitra_profile)
            else:
                 # Fallback/Error if creator isn't a Mitra?
                 # For now, if Superadmin creates a cashier, they must specify owner? 
                 # Or Superadmin shouldn't create cashiers directly without context?
                 # The requirement says "Mitra creates cashier".
                 # If created_by is Superadmin, maybe we just fail or leave unlinked?
                 # Let's assume valid flow for now.
                 pass
            
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
        
        # Update Profiles
        if hasattr(instance, 'mitra_profile'):
            mitra = instance.mitra_profile
            # Check where location is coming from
            loc = profile_data.get('location') or self.initial_data.get('location')
            if loc:
                mitra.location = loc
                mitra.save()
            
            # Update Payment Info if provided
            payment_info = self.context['request'].data.get('payment_info')
            if payment_info:
                if isinstance(payment_info, str):
                    try:
                        payment_info = json.loads(payment_info)
                    except json.JSONDecodeError:
                        payment_info = {}
                
                # Fields like bank_name, ewallet removed per user request
                pass

            qris_image = self.context['request'].FILES.get('qris_image')
            if qris_image is not None:
                mitra.qris_image = qris_image
                mitra.save()
            elif 'qris_image' in self.context['request'].data:
                qris_str = self.context['request'].data.get('qris_image')
                if qris_str in ['', 'null', None]:
                    mitra.qris_image = None
                    mitra.save()
            
            qris_data = self.context['request'].data.get('qris_data')
            if qris_data is not None:
                 mitra.qris_data = qris_data
                 mitra.save()

        
        # Avatar is on UserProfile
        if instance.profile and 'avatar' in profile_data:
             instance.profile.avatar = profile_data['avatar']
             instance.profile.save()
        
        return instance


class TrustedDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustedDevice
        fields = ['id', 'device_name', 'ip_address', 'last_used', 'created_at']


class LoginAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginAttempt
        fields = ['id', 'device_name', 'ip_address', 'status', 'created_at', 'expires_at']
