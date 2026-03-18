#!/bin/bash
set -e

echo "=== Running migrations ==="
python apps/api/manage.py migrate --noinput

echo "=== Starting seed in background ==="
python apps/api/run_seed.py &

echo "=== Starting Daphne (ASGI) on 0.0.0.0:8000 ==="
cd apps/api && exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
