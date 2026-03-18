#!/bin/bash
set -e

echo "=== Fixing PM2 config for Gunicorn ==="

# Create a wrapper shell script for gunicorn
cat > /var/www/fnb/start-api.sh << 'SHELLEOF'
#!/bin/bash
cd /var/www/fnb/apps/api
source venv/bin/activate
export DATABASE_URL="postgres://fnb_user:OmdenFnb2026!@localhost:5432/fnb_db"
export DEBUG="False"
export ALLOWED_HOSTS="103.87.66.233,localhost,127.0.0.1"
export SECRET_KEY="omden-fnb-production-secret-key-2026-change-me"
exec daphne -b 127.0.0.1 -p 8000 config.asgi:application
SHELLEOF
chmod +x /var/www/fnb/start-api.sh

# Update PM2 ecosystem
cat > /var/www/fnb/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'fnb-api',
      script: '/var/www/fnb/start-api.sh',
      interpreter: '/bin/bash',
      cwd: '/var/www/fnb/apps/api',
    }
  ]
};
PM2EOF

pm2 delete all 2>/dev/null || true
pm2 start /var/www/fnb/ecosystem.config.js
sleep 3
pm2 status
pm2 logs fnb-api --lines 10 --nostream

echo "=== Testing API ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://127.0.0.1:8000/api/v1/ || echo "Gunicorn not responding yet"
curl -s -o /dev/null -w "Nginx Status: %{http_code}\n" http://localhost/api/v1/ || echo "Nginx not responding"
