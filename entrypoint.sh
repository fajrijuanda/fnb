#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run Migrations
echo "Running Migrations..."
python manage.py migrate

# Run Seed Scripts
echo "Running Seed Scripts..."
python apps/api/seed_users.py
python apps/api/seed_products.py

# Start Gunicorn
echo "Starting Server..."
exec gunicorn apps.api.config.wsgi --log-file -
