#!/bin/bash
set -ex

# 1. Pull changes and install python deps
cd /var/www/fnb
sudo -u ubuntu git fetch --all
sudo -u ubuntu git reset --hard origin/master
sudo -u ubuntu git clean -fd
cd /var/www/fnb/apps/api
sudo -u ubuntu bash -c 'source venv/bin/activate && pip install -r ../../requirements.txt'

# 2. Modify Nginx
sudo mv /tmp/fnb_nginx.conf /etc/nginx/sites-available/fnb
sudo nginx -t && sudo systemctl restart nginx

# 3. Apply PM2 start scripts
cd /var/www/fnb/scripts/deploy
sudo -u ubuntu bash fix_pm2.sh
