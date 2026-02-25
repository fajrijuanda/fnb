#!/bin/bash
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1,api.omden.id,omden.id"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"
cd /var/www/fnb/apps/api
source venv/bin/activate
echo "Running hard wipe python script..."
PYTHONPATH=. python /tmp/hard_wipe_qris.py
echo "Deleting physical images in media folder..."
find /var/www/fnb/apps/api/media -type f \( -name '*qris*' -iname '*qris*' \) -delete
echo "Checking store settings just in case..."
PYTHONPATH=. python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from core.models import StoreSettings; s = StoreSettings.objects.first(); print('Store settings QRIS:', getattr(s, 'qris_image', None))"
echo "All done!"
