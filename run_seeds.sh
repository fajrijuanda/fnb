#!/bin/bash
set -e

echo "=== Seeding VPS Database ==="
cd /var/www/fnb/apps/api
source venv/bin/activate

export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"

echo "--- 1. Seeding Users ---"
python seed_users.py

echo ""
echo "--- 2. Seeding Products ---"
python seed_products.py

echo ""
echo "--- 3. Seeding Modifiers (Varian Rasa) ---"
python seed_modifiers_varian.py

echo ""
echo "=== All Seeding Complete! ==="
