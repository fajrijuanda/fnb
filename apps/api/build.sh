#!/usr/bin/env bash
# exit on error
set -o errexit

# Fix for potential python path issues in some environments
unset PYTHONHOME
unset PYTHONPATH

# Dependencies are installed by buildpack, skip pip install
# collectstatic is handled by buildpack
# python manage.py collectstatic --no-input

python manage.py migrate
