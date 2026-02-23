#!/bin/bash
set -e
cd /var/www/fnb/apps/api
source venv/bin/activate
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"

echo "=== Running pending migrations ==="
python manage.py migrate --noinput 2>&1

echo "=== Seeding Users ==="
python seed_users_vps.py 2>&1

echo "=== PM2 restart ==="
pm2 restart all 2>&1
pm2 status

echo "=== Done ==="
