#!/bin/bash
set -e

echo "=== Seeding Products ==="
cd /var/www/fnb/apps/api
source venv/bin/activate

export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"

python seed_products.py

echo "=== Complete ==="
