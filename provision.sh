#!/usr/bin/env bash
# Provision nginx to serve the Skans Labs static site. Run as root (via sudo).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "[1/6] installing nginx..."
apt-get update -qq
apt-get install -y -qq nginx

echo "[2/6] publishing site to /var/www/skanslabs..."
mkdir -p /var/www/skanslabs
cp -rT /home/skans/skanslabs-site/public /var/www/skanslabs
chown -R www-data:www-data /var/www/skanslabs

echo "[3/6] writing nginx server block..."
cat > /etc/nginx/sites-available/skanslabs <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name skanslabs.com www.skanslabs.com _;

    root /var/www/skanslabs;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location = /favicon.svg { access_log off; }

    location ~* \.(?:css|js|svg|png|jpe?g|gif|ico|webp|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
NGINX

echo "[4/6] enabling site..."
ln -sf /etc/nginx/sites-available/skanslabs /etc/nginx/sites-enabled/skanslabs
rm -f /etc/nginx/sites-enabled/default

echo "[5/6] firewall (if active)..."
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow 80/tcp || true
fi

echo "[6/6] testing + reloading nginx..."
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx
echo "PROVISION DONE"
