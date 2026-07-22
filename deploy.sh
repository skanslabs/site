#!/usr/bin/env bash
# RETIRED 2026-07-21 — skanslabs.com is on Cloudflare Pages, not LAN nginx.
#
# Old path: rsync public/ → skans@192.168.109.223 + sudo into /var/www/skanslabs
# Current path: git push origin main → Cloudflare Pages project "skans-site"
#   build: npm run build   output: public/
#
# See HOSTING.md
set -euo pipefail
echo "error: deploy.sh is retired."
echo "skanslabs.com is served by Cloudflare Pages (project skans-site)."
echo "Build:  npm run build"
echo "Publish: git push origin main   # write access to skanslabs/site required"
echo "Details: $(dirname "$0")/HOSTING.md"
exit 1
