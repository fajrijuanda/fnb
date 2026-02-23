#!/bin/bash
set -e

echo "=== Running migrations ==="
python apps/api/manage.py migrate --noinput

echo "=== Starting seed in background ==="
python apps/api/run_seed.py &

echo "=== Starting gunicorn on 0.0.0.0:8000 ==="
cd apps/api && exec gunicorn config.wsgi --bind 0.0.0.0:8000 --workers 2 --timeout 120 --log-file - --access-logfile -
