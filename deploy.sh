#!/bin/bash
set -e

echo "============================================="
echo "  FNB Backend API Setup"
echo "============================================="

# --- 1. Extract code ---
echo "=== Extracting code ==="
cd /var/www/fnb
rm -rf apps requirements.txt 2>/dev/null || true
tar xzf /tmp/fnb-api.tar.gz
echo "Code extracted!"
ls -la apps/api/

# --- 2. Python venv + deps ---
echo "=== Setting up Python ==="
cd /var/www/fnb/apps/api
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r /var/www/fnb/requirements.txt -q
pip install pywebpush -q
echo "Dependencies installed!"

# --- 3. Environment variables ---
echo "=== Configuring environment ==="
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"

# --- 4. Migrations + static ---
echo "=== Running migrations ==="
python manage.py migrate --noinput
python manage.py collectstatic --noinput
echo "Migrations done!"

deactivate

# --- 5. PM2 ---
echo "=== Setting up PM2 ==="
cat > /var/www/fnb/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'fnb-api',
      cwd: '/var/www/fnb/apps/api',
      script: 'venv/bin/gunicorn',
      args: 'config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 120',
      env: {
        DATABASE_URL: 'postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db',
        DEBUG: 'False',
        ALLOWED_HOSTS: '103.87.66.233,localhost,127.0.0.1',
        SECRET_KEY: 'omden-fnb-production-secret-key-2026-change-me',
      }
    }
  ]
};
PM2EOF

pm2 delete all 2>/dev/null || true
pm2 start /var/www/fnb/ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

# --- 6. Nginx ---
echo "=== Configuring Nginx ==="
sudo tee /etc/nginx/sites-available/fnb > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 103.87.66.233;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /var/www/fnb/apps/api/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/fnb/apps/api/media/;
        expires 30d;
    }

    location / {
        return 200 'FNB API Server Running';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/fnb /etc/nginx/sites-enabled/fnb
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "============================================="
echo "  DEPLOYMENT COMPLETE!"
echo "============================================="
echo "API: http://103.87.66.233/api/v1/"
echo "Admin: http://103.87.66.233/admin/"
echo "============================================="
pm2 status
