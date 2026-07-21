#!/usr/bin/env bash
# Push the Skans Labs site to the web box and reload nginx.
# Auto-cache-busts CSS/JS via a content hash so Cloudflare (which fronts
# skanslabs.com) can't serve a stale stylesheet against fresh HTML.
#
# Usage:
#   SSHPASS='...' ./deploy.sh     # password auth via sshpass
#   ./deploy.sh                   # if you've set up ssh key auth
set -euo pipefail

BOX="skans@192.168.109.223"
HERE="$(cd "$(dirname "$0")" && pwd)"
PUB="$HERE/public"
SSH="ssh -o StrictHostKeyChecking=accept-new"
[ -n "${SSHPASS:-}" ] && SSH="sshpass -e $SSH"

echo ">> compiling Tailwind..."
( cd "$HERE" && npx tailwindcss -i src/input.css -o public/styles.css --minify >/dev/null )

echo ">> assembling sub-pages (privacy/terms/contact/about)..."
( cd "$HERE" && node build-pages.mjs )

echo ">> stamping cache-bust version (content hash)..."
VER=$(cat "$PUB/styles.css" "$PUB/enclave.js" "$PUB/app.js" | md5sum | cut -c1-8)
# rewrite every ?v=... on local assets to the new hash, across ALL html pages
for f in "$PUB"/*.html; do sed -i -E "s/\?v=[A-Za-z0-9]+/?v=$VER/g" "$f"; done
echo "   version = $VER"

echo ">> syncing to box staging..."
rsync -az --delete -e "$SSH" "$PUB/" "$BOX:/home/skans/skanslabs-site/public/"

echo ">> publishing to /var/www/skanslabs + reloading nginx..."
$SSH "$BOX" "echo '${SSHPASS:-}' | sudo -S -p '' bash -c '\
  rm -rf /var/www/skanslabs/* && \
  cp -rT /home/skans/skanslabs-site/public /var/www/skanslabs && \
  chown -R www-data:www-data /var/www/skanslabs && \
  nginx -t && systemctl reload nginx'"

echo ">> pinging IndexNow (Bing/Yandex/etc. recrawl)..."
INDEXNOW_KEY=633776baf62f2edd553d1abced5d7d5f1def6f5c9cebb59643790280ebb3e015
# best-effort — must never fail the deploy (hence the || true guards)
grep -oE '<loc>[^<]+</loc>' "$PUB/sitemap.xml" | sed -E 's|</?loc>||g' | while read -r u; do
  [ -n "$u" ] || continue
  curl -s -m 10 -o /dev/null "https://api.indexnow.org/indexnow?url=${u}&key=${INDEXNOW_KEY}" && echo "   pinged $u" || echo "   (ping failed: $u)"
done || true

echo ">> done. https://skanslabs.com/  (assets at ?v=$VER)"
echo "   NOTE: HTML itself is served fresh by Cloudflare; if you ever change"
echo "   index.html structure and still see stale, purge Cloudflare cache."
