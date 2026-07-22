#!/usr/bin/env bash
# RETIRED 2026-07-21 — skanslabs.com is on Cloudflare Pages, not LAN nginx.
# See HOSTING.md
set -euo pipefail
echo "error: provision.sh is retired (LAN nginx origin)."
echo "skanslabs.com is Cloudflare Pages project skans-site — no local nginx provision."
echo "Details: $(dirname "$0")/HOSTING.md"
exit 1
