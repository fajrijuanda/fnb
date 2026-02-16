from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from .models import Notification
from .serializers import NotificationSerializer, WebPushSubscriptionSerializer
from .web_push import send_notification_to_user

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})


class WebPushSubscriptionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WebPushSubscriptionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WebPushTestView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Allow user to test their notification
        count = send_notification_to_user(
            request.user, 
            title="Test Notification", 
            message="This is a test notification from CloudPOS.",
            url="/notifications"
        )
        return Response({"status": "success", "sent_count": count})

class VapidPublicKeyView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # return public key stripped of headers/footers if needed, 
        # but usually frontend library handles PEM or base64.
        # Let's return the key as is or just the body.
        # For simplicity, returning the whole PEM string, user can parse.
        
        # Actually proper VAPID public key for frontend usually is base64 url safe without headers.
        # But pywebpush keys are EC points.
        
        # Let's try to parse the public key from settings and return the raw applicationServerKey (base64)
        # However, simpler is to just return what we have and let frontend handle it or clean it up.
        
        # The key in settings is PEM.
        # Frontend PushManager.subscribe takes applicationServerKey as a Uint8Array (from base64).
        
        # Clean the PEM
        pem = settings.VAPID_PUBLIC_KEY
        # Remove headers
        key_b64 = pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace("\n", "").strip()
        
        return Response({"publicKey": key_b64})
