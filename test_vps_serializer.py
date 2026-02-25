import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from users.serializers import UserSerializer

try:
    user = User.objects.get(id=3)
    serializer = UserSerializer(user)
    print("PAYMENT INFO:", serializer.data.get('payment_info'))
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
