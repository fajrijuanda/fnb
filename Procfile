web: gunicorn apps.api.config.wsgi --log-file -
release: python manage.py migrate && python apps/api/seed_users.py && python apps/api/seed_products.py
