#!/bin/bash
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1,api.omden.id,omden.id"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"
cd /var/www/fnb/apps/api
source venv/bin/activate
echo "Running wipe_qris.py..."
PYTHONPATH=. python /tmp/wipe_qris.py
echo "Done!"
