#!/usr/bin/env bash
# exit on error
set -o errexit

# Dependencies are installed by buildpack, skipping pip install
python manage.py collectstatic --no-input
python manage.py migrate
