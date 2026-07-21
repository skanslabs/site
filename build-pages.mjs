/* Assemble static sub-pages (privacy / terms / contact / about) that reuse
 * index.html's <head> shell, SVG sprite, header and footer, so they never drift.
 * Run by deploy.sh before the cache-bust stamp. Content-only; no framework. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(ROOT, "public");
const index = fs.readFileSync(path.join(PUB, "index.html"), "utf8");

const SITE = "https://skanslabs.com";
const ldGraph = (nodes) => JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
const ORG = { "@type": "Organization", "@id": `${SITE}/#org`, name: "Skans Labs", url: `${SITE}/`, logo: `${SITE}/apple-touch-icon.png` };

function grab(src, startRe, endTag) {
  const m = startRe.exec(src);
  if (!m) throw new Error("build-pages: not found " + startRe);
  const end = src.indexOf(endTag, m.index);
  if (end < 0) throw new Error("build-pages: end not found " + endTag);
  return src.slice(m.index, end + endTag.length);
}

const sprite = grab(index, /<svg width="0" height="0"/, "</svg>");
// on sub-pages, in-page hash links must jump to the homepage sections
const toHome = (html) => html.replace(/href="#/g, 'href="/#');
const header = toHome(grab(index, /<header class="site-header"/, "</header>"));
const footer = toHome(grab(index, /<footer class="site-footer/, "</footer>"));

const THEME = `<script>(function(){try{var t=localStorage.getItem('skans-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();</script>`;

const head = (title, desc, slug, opts = {}) => {
  const url = `https://skanslabs.com/${slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Skans Labs</title>
  <meta name="description" content="${desc}" />
  <meta name="robots" content="${opts.noindex ? "noindex, nofollow" : "index, follow"}" />
  <meta name="theme-color" content="#0a0d12" />
  <link rel="canonical" href="${url}" />
  ${THEME}
  <link rel="icon" href="/favicon.svg?v=0" type="image/svg+xml" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png?v=0" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=0" />
  <link rel="preload" href="/fonts/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title} — Skans Labs" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:site_name" content="Skans Labs" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="https://skanslabs.com/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} — Skans Labs" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="https://skanslabs.com/og.png" />
  <link rel="stylesheet" href="/styles.css?v=0" />
  <script type="application/ld+json">${ldGraph([ORG,
    { "@type": "WebPage", name: `${title} — Skans Labs`, description: desc, url, isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#org` } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Skans Labs", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: title, item: url }] }])}</script>
</head>
<body>
  <a class="skip-link btn btn-ghost" href="#main">Skip to content</a>
`;
};

function write({ slug, title, desc, eyebrow, h1, updated, body }) {
  const meta = updated ? `<p class="legal-updated">Last updated: ${updated}</p>` : "";
  const html = head(title, desc, slug) + sprite + header +
`
  <main id="main" class="legal-main">
    <div class="legal">
      <p class="legal-eyebrow">${eyebrow}</p>
      <h1>${h1}</h1>
      ${meta}
${body}
    </div>
  </main>
` + footer + `
  <script src="/app.js?v=0" defer></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(PUB, `${slug}.html`), html);
  return slug;
}

const ENTITY = "La Costa Services, LLC";
const EMAIL = "hello@skanslabs.com";
const UPDATED = "2 July 2026";

const pages = [
  {
    slug: "about", title: "Company", eyebrow: "Company", h1: "About Skans Labs",
    desc: "Skans Labs builds an on-premises root of trust for isolated camera, IoT, OT and building-automation networks.",
    body: `      <p class="lead">Skans Labs builds an on-premises root of trust for the networks that can't — or shouldn't — touch the cloud: isolated camera, IoT, OT, and building-automation enclaves.</p>
      <h2>What we do</h2>
      <p>Skans gives every device on an isolated network its own identity, then adds the controls that identity makes possible: access control, patching and firmware, encryption and hardening, backup and configuration vaulting, monitoring, and audit-ready compliance evidence. It runs entirely on the local network — set up by the technician who installs the cameras, not a security team.</p>
      <h2>How we build</h2>
      <ul>
        <li><strong>Air-gap-first.</strong> The whole root of trust runs on the enclave itself. When a feature needs outside data, it arrives through a controlled, signed update — never by opening the network to the internet.</li>
        <li><strong>You own the keys.</strong> Certificates, credentials, and audit records stay on your hardware.</li>
        <li><strong>Signal over noise.</strong> You see a meaningful, correlated list of findings per device — never a raw firehose of events.</li>
        <li><strong>Honest engineering.</strong> We report what a system actually did, and we don't ship theater.</li>
      </ul>
      <h2>The company</h2>
      <p>Skans Labs is a product of ${ENTITY}. For partnership, press, or product questions, email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`,
  },
  {
    slug: "privacy", title: "Privacy Policy", eyebrow: "Legal", h1: "Privacy Policy", updated: UPDATED,
    desc: "How Skans Labs handles information on skanslabs.com.",
    body: `      <p>This website (skanslabs.com) is operated by ${ENTITY} (“Skans Labs”, “we”, “us”). This policy explains what we collect when you visit and how we use it.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Server logs.</strong> Our web infrastructure records standard request data — such as IP address, browser type, and pages requested — kept briefly to operate and secure the site.</li>
        <li><strong>Messages you send.</strong> If you email us or submit the briefing form, we receive the information you choose to provide, such as your name, email address, and message.</li>
        <li><strong>Your preference.</strong> The site remembers your light/dark theme choice in your browser’s local storage. That value never leaves your device.</li>
      </ul>
      <h2>What we don’t do</h2>
      <p>We don’t run third-party advertising or analytics trackers, and we don’t sell your personal information.</p>
      <h2>How we use information</h2>
      <p>To respond to your inquiries, to operate and secure the website, and to meet legal obligations.</p>
      <h2>Sharing</h2>
      <p>We share information only with service providers who help us run the site and email (for example, hosting), under confidentiality obligations, or where required by law.</p>
      <h2>Security</h2>
      <p>The site is served over HTTPS, and we apply reasonable safeguards to the limited information we hold.</p>
      <h2>Your choices</h2>
      <p>You may ask us to access or delete information you’ve sent us — email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
      <h2>Changes</h2>
      <p>We may update this policy from time to time; the “last updated” date above reflects the current version.</p>
      <h2>Contact</h2>
      <p>${ENTITY} · <a href="mailto:${EMAIL}">${EMAIL}</a></p>`,
  },
  {
    slug: "terms", title: "Terms of Use", eyebrow: "Legal", h1: "Terms of Use", updated: UPDATED,
    desc: "The terms that govern use of skanslabs.com.",
    body: `      <p>These terms govern your use of skanslabs.com, operated by ${ENTITY} (“Skans Labs”). By using the site, you agree to them.</p>
      <h2>Use of the site</h2>
      <p>This website is provided for general information about our products. You agree not to misuse it, disrupt it, or attempt to gain unauthorized access to any system or data.</p>
      <h2>Intellectual property</h2>
      <p>The “Skans” and “Skans Labs” names, logos, and the content of this site are owned by ${ENTITY} and may not be used without our prior written permission.</p>
      <h2>No warranty</h2>
      <p>The site and its content are provided “as is,” without warranties of any kind, express or implied.</p>
      <h2>Limitation of liability</h2>
      <p>To the maximum extent permitted by law, ${ENTITY} will not be liable for any damages arising from your use of, or inability to use, this site.</p>
      <h2>External links</h2>
      <p>We are not responsible for the content or practices of third-party websites we link to.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of California, without regard to its conflict-of-laws rules.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time; continued use of the site means you accept the current version.</p>
      <h2>Contact</h2>
      <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>`,
  },
  {
    slug: "contact", title: "Contact", eyebrow: "Contact", h1: "Get in touch",
    desc: "How to reach Skans Labs — email, product briefings, and responsible disclosure.",
    body: `      <p class="lead">The fastest way to reach us is email.</p>
      <h2>Email</h2>
      <p><a href="mailto:${EMAIL}">${EMAIL}</a> — for product, partnership, and press inquiries.</p>
      <h2>Request a briefing</h2>
      <p>To see Skans in action, use the <a href="/#contact">briefing form on our homepage</a> and we’ll follow up.</p>
      <h2>Security researchers</h2>
      <p>For responsible disclosure, see our <a href="/.well-known/security.txt">security.txt</a>.</p>
      <h2>Company</h2>
      <p>Skans Labs is a product of ${ENTITY}.</p>`,
  },
];

const built = pages.map(write);
console.log("build-pages: wrote " + built.map((s) => s + ".html").join(", "));

// ---- pricing (STAGED: noindex + not in nav or sitemap until counsel clears public prices) ----
(function writePricing() {
  const slug = "pricing";
  const title = "Pricing";
  const desc = "Skans editions — licensed per site, metered by managed endpoints. Community is free and production-ready.";
  const plans = [
    { name: "Community", price: "Free", per: "", band: "Up to 25 endpoints",
      feats: ["Device identity + built-in CA", "Endpoint agent + NAC visibility", "Threat &amp; malware feeds", "Full community driver pack", "Single site &middot; community support"],
      cta: "Get Community" },
    { name: "Essential", price: "$499", per: "/ site &middot; yr", band: "Up to 100 endpoints",
      feats: [{ head: "Everything in Community, plus" }, "Patch management + enforcement", "Backup &amp; disaster recovery", "Alerting &amp; notifications", "Password &amp; lockout baseline", "Email support"],
      cta: "Choose Essential" },
    { name: "Professional", price: "$999", per: "/ site &middot; yr", band: "Up to 500 endpoints", featured: true, primary: true,
      feats: [{ head: "Everything in Essential, plus" }, "NIST 800-171 / CMMC / ISO 27001 evidence", "802.1X NAC, dynamic VLAN, segmentation", "Vulnerability management", "Log &amp; topology fusion", "Business-hours support"],
      cta: "Choose Professional" },
    { name: "Business", price: "$2,999", per: "/ site &middot; yr", band: "Up to 1,000 endpoints",
      feats: [{ head: "Everything in Professional, plus" }, "OT/ICS driver depth &mdash; S7-1500, Desigo, BACnet", "Industrial cert lanes (OPC UA GDS Push)", "Priority support"],
      cta: "Choose Business" },
    { name: "Enterprise", price: "Contact", per: "", band: "1,000+ endpoints &middot; multi-site",
      feats: [{ head: "Everything in Business, plus" }, "Distributed Core + Edge (per-site)", "High availability", "Air-gap Update Service + offline licensing", "SSO, advanced RBAC, full audit", "Dedicated support + SLA"],
      cta: "Contact sales" },
  ];
  const card = (p) => `<article class="card plan${p.featured ? " featured" : ""} reveal">${p.featured ? '<span class="plan-tag">Most popular</span>' : ""}
            <div class="plan-name">${p.name}</div>
            <div class="plan-price">${p.price}${p.per ? `<small> ${p.per}</small>` : ""}</div>
            <div class="plan-band">${p.band}</div>
            <ul class="plan-feats">${p.feats.map((f) => (f.head ? `<li class="head">${f.head}</li>` : `<li>${f}</li>`)).join("")}</ul>
            <div class="plan-cta"><a class="btn ${p.primary ? "btn-primary" : "btn-ghost"}" href="/#contact">${p.cta}</a></div>
          </article>`;
  const main = `
  <main id="main">
    <section class="section" id="pricing">
      <div class="container-wide">
        <p class="kicker reveal">Editions</p>
        <h2 class="section-title reveal reveal-d1" style="max-width:24ch">Priced per site — by what you protect, not who you are.</h2>
        <p class="lead reveal reveal-d2" style="margin-top:16px">One Skans appliance secures one site on one license. You're metered by <strong>managed endpoints</strong> — every device Skans gives an identity to: cameras, controllers, PLCs, switches, the server itself — not by seats, sockets, or agents. Community is free and runs in production; step a site up as it grows.</p>
        <div class="plan-grid">
          ${plans.map(card).join("\n          ")}
        </div>
        <div class="plan-notes reveal">
          <p>Prices are annual, in USD, <strong>per site</strong>. Multi-site estates license each site — distributed <strong>Core&nbsp;+&nbsp;Edge</strong> deployments license each Edge. <a href="/#contact">Talk to us</a> about site packs and volume.</p>
          <p><strong>Managed endpoints</strong> counts devices under active Skans management — identity, certificates, policy, or monitoring. The endpoint agents running on those devices are never metered separately.</p>
        </div>
      </div>
    </section>
  </main>`;
  const html = head(title, desc, slug, { noindex: true }) + sprite + header + main + footer +
    `\n  <script src="/app.js?v=0" defer></script>\n</body>\n</html>\n`;
  fs.writeFileSync(path.join(PUB, "pricing.html"), html);
  console.log("build-pages: wrote pricing.html (STAGED — noindex, unlinked, not in sitemap)");
})();

// ---- crawler / AI / SEO files ----
const siteUrls = [`${SITE}/`, ...pages.map((p) => `${SITE}/${p.slug}`)];
fs.writeFileSync(path.join(PUB, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${siteUrls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(PUB, "robots.txt"),
  `# Skans Labs — crawlers welcome\nUser-agent: *\nAllow: /\n\n# AI assistants are welcome to read and cite this site\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(PUB, "llms.txt"),
  `# Skans Labs\n\n> Skans is an on-premises security appliance that becomes the root of trust for isolated camera, IoT, OT, and building-automation networks — giving every device its own certificate identity plus access control, patching, backup, monitoring, vulnerability management, and NIST 800-171 / CMMC compliance evidence, run by the technician who installs the equipment, with nothing leaving the local network.\n\n## Company\n- Skans Labs is a product of ${ENTITY}.\n- Contact: ${EMAIL}\n\n## Site\n- [Home](${SITE}/): what Skans is and who it's for\n- [Company](${SITE}/about): about Skans Labs\n- [Contact](${SITE}/contact): get in touch\n- [Privacy](${SITE}/privacy) · [Terms](${SITE}/terms)\n\n## Documentation & writing\n- [Documentation](https://docs.skanslabs.com/): getting started, concepts, how-tos, compliance, reference\n- [Blog](https://blog.skanslabs.com/): announcements and how-tos\n- Docs AI index: https://docs.skanslabs.com/llms.txt\n`);
// IndexNow key — hosted at /<key>.txt so search engines can verify change-notification
// pings. Public by design (not a secret). Same key used on docs + blog. See deploy.sh ping.
const INDEXNOW_KEY = "633776baf62f2edd553d1abced5d7d5f1def6f5c9cebb59643790280ebb3e015";
fs.writeFileSync(path.join(PUB, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
console.log("build-pages: wrote robots.txt, sitemap.xml, llms.txt, IndexNow key");

// ---- cache-bust: stamp every ?v= on local assets with a content hash (ported from retired deploy.sh,
// so Cloudflare Pages / browsers fetch fresh CSS+JS after a change instead of serving ?v=0 forever) ----
const assetBytes = ["styles.css", "enclave.js", "app.js"].map((f) => {
  try { return fs.readFileSync(path.join(PUB, f)); } catch { return Buffer.alloc(0); }
});
const VER = crypto.createHash("md5").update(Buffer.concat(assetBytes)).digest("hex").slice(0, 8);
for (const f of fs.readdirSync(PUB)) {
  if (!f.endsWith(".html")) continue;
  const p = path.join(PUB, f);
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\?v=[A-Za-z0-9]+/g, `?v=${VER}`));
}
console.log("build-pages: cache-bust stamped ?v=" + VER + " across all html");
