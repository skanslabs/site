# skanslabs.com — hosting

**Canonical host:** Cloudflare **Pages** (Workers edge / global CDN).

| Host | Cloudflare project | GitHub repo | Build | Output |
|------|--------------------|-------------|-------|--------|
| `skanslabs.com` + `www` | **skans-site** | `skanslabs/site` (`main`) | `npm run build` | `public/` |

- Custom domains are Cloudflare-proxied (`server: cloudflare`, `cf-ray`).
- Production auto-deploys on **push to `main`** via the Cloudflare Pages GitHub app.
- Preview: this project only auto-builds **production `main`** (branch previews are not reliable).

## Deploy (current)

```bash
cd /home/david/skanslabs-site
npm run build          # tailwind + build-pages.mjs + cache-bust ?v=
git add -A && git commit -m "…"
git push origin main   # Cloudflare Pages builds → skanslabs.com
```

Push needs a **write-capable** GitHub credential for `skanslabs/site` (user PAT or a write deploy key).  
Read-only deploy keys (`Permission denied to deploy key`) can clone but **cannot** publish.

## Retired (do not use)

| Path | Status |
|------|--------|
| `deploy.sh` → `skans@192.168.109.223` nginx `/var/www/skanslabs` | **RETIRED** 2026-07-21 |
| Direct rsync / sudo nginx reload on LAN box | **RETIRED** |

`deploy.sh` remains only as a stub that prints this and exits non-zero, so nobody ships to a dead origin by habit.

## Related

- Product docs: `docs.skanslabs.com` → Cloudflare Pages project **skans-docs** (`skanslabs/Docs` → `dist/`)
- Blog: `blog.skanslabs.com` → Cloudflare Pages project **skans-blog** (same repo → `dist-blog/`)
- Portal / SUS API: `portal.skanslabs.com` / `sus.skanslabs.com` — OCI origin, **Cloudflare-proxied** with Origin CA (separate from Pages)
