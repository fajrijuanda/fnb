#!/bin/bash
set -e

echo "============================================="
echo "  FNB Backend API Deployment"
echo "============================================="

# --- 1. Clone Repository (shallow, only backend needed) ---
echo ""
echo "=== Step 1: Cloning repository ==="
rm -rf /var/www/fnb/* /var/www/fnb/.* 2>/dev/null || true
cd /var/www/fnb
git clone --depth 1 https://github.com/fajrijuanda/fnb.git . || {
    echo "Clone failed, trying with sparse checkout..."
    git init
    git remote add origin https://github.com/fajrijuanda/fnb.git
    git fetch --depth 1 origin master
    git checkout FETCH_HEAD
}
echo "Repository cloned!"
ls -la

# --- 2. Setup Python Virtual Environment ---
echo ""
echo "=== Step 2: Setting up Python environment ==="
cd /var/www/fnb/apps/api
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r /var/www/fnb/requirements.txt
pip install pywebpush
echo "Python dependencies installed!"

# --- 3. Configure Environment ---
echo ""
echo "=== Step 3: Configuring environment ==="
cat > /var/www/fnb/apps/api/.env << 'ENVEOF'
DATABASE_URL=postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db
DEBUG=False
ALLOWED_HOSTS=103.87.66.233,localhost,127.0.0.1
SECRET_KEY=omden-fnb-production-secret-key-2026-change-me
ENVEOF

# --- 4. Run Django Migrations ---
echo ""
echo "=== Step 4: Running migrations ==="
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"
python manage.py migrate
python manage.py collectstatic --noinput
echo "Migrations and static files done!"

deactivate

# --- 5. Setup PM2 for Gunicorn ---
echo ""
echo "=== Step 5: Setting up PM2 ==="
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

# --- 6. Configure Nginx as Reverse Proxy ---
echo ""
echo "=== Step 6: Configuring Nginx ==="
sudo tee /etc/nginx/sites-available/fnb > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 103.87.66.233;

    client_max_body_size 10M;

    # CORS headers for Vercel frontend
    add_header Access-Control-Allow-Origin "https://fnb-five.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Device-Id" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://fnb-five.vercel.app" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Device-Id" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static files
    location /static/ {
        alias /var/www/fnb/apps/api/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django media files
    location /media/ {
        alias /var/www/fnb/apps/api/media/;
        expires 30d;
    }

    # Health check
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
echo "Backend API: http://103.87.66.233/api/v1/"
echo "Django Admin: http://103.87.66.233/admin/"
echo "Frontend (Vercel): https://fnb-five.vercel.app"
echo "============================================="
pm2 status
