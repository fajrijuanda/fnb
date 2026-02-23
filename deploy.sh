#!/bin/bash
set -e

echo "============================================="
echo "  FNB Application Deployment Script"
echo "============================================="

# --- 1. Resize swap to 4GB ---
echo ""
echo "=== Step 1: Resizing swap to 4GB ==="
if [ "$(sudo swapon --show | grep -c '/swapfile')" -gt 0 ]; then
    sudo swapoff /swapfile
fi
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo "Swap: $(free -m | grep Swap | awk '{print $2}')MB"

# --- 2. Clone Repository ---
echo ""
echo "=== Step 2: Cloning repository ==="
cd /var/www/fnb
if [ -d ".git" ]; then
    echo "Repo exists, pulling latest..."
    git pull origin master
else
    git clone https://github.com/fajrijuanda/fnb.git .
fi

# --- 3. Setup Django Backend ---
echo ""
echo "=== Step 3: Setting up Django Backend ==="
cd /var/www/fnb/apps/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r /var/www/fnb/requirements.txt
pip install pywebpush  # for web push notifications

# Create .env for Django
cat > /var/www/fnb/apps/api/.env << 'ENVEOF'
DATABASE_URL=postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db
DEBUG=False
ALLOWED_HOSTS=103.87.66.233,localhost,127.0.0.1
SECRET_KEY=omden-fnb-production-secret-key-2026-change-me
ENVEOF

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput

deactivate

# --- 4. Setup Next.js Frontend ---
echo ""
echo "=== Step 4: Setting up Next.js Frontend ==="
cd /var/www/fnb/apps/web

# Create .env.local for Next.js
cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://103.87.66.233/api/v1
ENVEOF

# Install dependencies and build
npm install
NODE_OPTIONS="--max-old-space-size=1024" npm run build

# --- 5. Setup PM2 processes ---
echo ""
echo "=== Step 5: Setting up PM2 ==="

# Create PM2 ecosystem file
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
    },
    {
      name: 'fnb-web',
      cwd: '/var/www/fnb/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://103.87.66.233/api/v1',
      }
    }
  ]
};
PM2EOF

pm2 delete all 2>/dev/null || true
pm2 start /var/www/fnb/ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

# --- 6. Configure Nginx ---
echo ""
echo "=== Step 6: Configuring Nginx ==="
sudo tee /etc/nginx/sites-available/fnb > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 103.87.66.233;

    client_max_body_size 10M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Django/Gunicorn)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/fnb /etc/nginx/sites-enabled/fnb
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "============================================="
echo "  DEPLOYMENT COMPLETE!"
echo "============================================="
echo "Frontend: http://103.87.66.233"
echo "Backend API: http://103.87.66.233/api/v1/"
echo "============================================="
pm2 status
