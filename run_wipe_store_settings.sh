#!/bin/bash
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1,api.omden.id,omden.id"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"
cd /var/www/fnb/apps/api
source venv/bin/activate
echo "Running StoreSettings wipe script..."
PYTHONPATH=. python /tmp/wipe_store_settings.py
echo "Double checking physical files one more time..."
find /var/www/fnb/apps/api/media -type f \( -iname '*qris*' \) -delete
echo "Restarting API cache purely just in case"
pm2 restart fnb-api
echo "All done!"
