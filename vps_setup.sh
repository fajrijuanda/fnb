#!/bin/bash
set -e

echo "=== Setting up PostgreSQL ==="
sudo -u postgres psql -c "CREATE USER fnb_user WITH PASSWORD 'OmdenFnb2026!';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE fnb_db OWNER fnb_user;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fnb_db TO fnb_user;" 2>/dev/null || echo "Privileges already granted"
echo "PostgreSQL configured!"

echo "=== Installing PM2 ==="
sudo npm install -g pm2
echo "PM2 installed!"

echo "=== Creating project directories ==="
sudo mkdir -p /var/www/fnb
sudo chown -R ubuntu:ubuntu /var/www/fnb
mkdir -p /var/www/fnb/api
mkdir -p /var/www/fnb/web
echo "Directories created!"

echo "=== Setup swap (1GB) for low-memory VPS ==="
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap created!"
else
    echo "Swap already exists"
fi

echo "=== All setup complete! ==="
free -m
