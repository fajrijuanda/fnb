from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from users.models import UserSession

class SingleSessionMiddleware(MiddlewareMixin):
    """
    Middleware to ensure that a user can only have one active session.
    Checks the 'X-Device-ID' header against the stored active_device_id in UserSession.
    """
    
    def process_request(self, request):
        if not request.user.is_authenticated:
            return None

        # internal or admin paths might be excluded if needed, 
        # but generally we want to enforce this API-wide.
        
        device_id = request.headers.get('X-Device-ID')
        if not device_id:
            return None # Skip check if no device ID provided (e.g. browser admin access?)
            
        try:
            session = UserSession.objects.get(user=request.user)
            if session.active_device_id and str(session.active_device_id) != device_id:
                return JsonResponse({
                    'status': 'force_logout',
                    'message': 'Sesi Anda telah berakhir karena akun digunakan di perangkat lain.'
                }, status=401)
        except UserSession.DoesNotExist:
            pass
            
        return None
