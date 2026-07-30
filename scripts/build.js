#!/usr/bin/env node
/**
 * Static site build.
 *
 * Renders index.html from the template + content JSON, copies assets, and emits
 * sitemap.xml / robots.txt / manifest / favicons. Single language (pt-PT), single
 * page. Zero dependencies; the whole build runs in tens of milliseconds, so
 * `npm run dev` just rebuilds and serves.
 *
 * Usage: node scripts/build.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const { render } = require(path.join(SRC, 'templates', 'page.js'));

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function dirSize(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}

/* ---------- warnings ---------- */

/**
 * The build is the last place that can catch content rot before a visitor does.
 * Nulls in site.json are honest unknowns, never invented values — so the audit checks
 * for absence and says what filling each gap would unlock.
 */
function audit(site, lqip) {
  const warn = [];

  if (!site.contact.phone) {
    warn.push(
      'contact.phone is unknown — the site has no phone/WhatsApp contact. For a local trade ' +
        'this is usually the top-converting channel after the booking link. Ask the client.'
    );
  }
  if (!site.contact.hours) {
    warn.push(
      `contact.hours is unknown — only "aberto até ${site.contact.closesAt}" (from Noona) is shown. ` +
        'Full weekly hours would also feed the LocalBusiness JSON-LD.'
    );
  }
  if (!site.company.nif) {
    warn.push('company.nif is unknown — JSON-LD ships without vatID.');
  }
  if (!site.contact.geo.lat) {
    warn.push('contact.geo is unknown — JSON-LD ships without geo coordinates for local search.');
  }
  // garagemdobrilho.pt was confirmed by the client on 2026-07-30 as the registered
  // domain, so the canonical/sitemap/JSON-LD host is no longer an assumption.

  const photos = Object.keys(lqip).length;
  if (photos === 0) {
    warn.push(
      'ZERO photographs supplied — every image slot is rendering its CSS fallback. The site ' +
        'stands, but a detailing site without its own photos is half a site. Shot list: ' +
        'src/assets/img/CREDITS.md.'
    );
  } else if (!lqip['hero-car']) {
    warn.push('hero photo (source/hero.jpg) still missing — the hero is on its gradient fallback.');
  }

  return warn;
}

/* ---------- extras ---------- */

const ICONS = [
  'favicon-32.png',
  'favicon-48.png',
  'favicon-96.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
];

function manifest(site, t) {
  return JSON.stringify(
    {
      name: `${site.company.name} — ${site.company.tagline}`,
      short_name: site.company.name,
      description: t.meta.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#07090d',
      theme_color: site.site.themeColor,
      lang: 'pt-PT',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    null,
    2
  );
}

const sitemap = (site) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site.site.domain}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

const robots = (site) => `User-agent: *
Allow: /

Sitemap: ${site.site.domain}/sitemap.xml`;

/**
 * Netlify/Cloudflare Pages read _headers. Fingerprinted assets get a one-year
 * immutable cache; HTML must always revalidate or a deploy won't reach anyone.
 */
const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/img/*
  Cache-Control: public, max-age=31536000, immutable

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate
`;

/* ---------- main ---------- */

function build() {
  const t0 = Date.now();

  const site = readJSON(path.join(SRC, 'content', 'site.json'));
  const t = readJSON(path.join(SRC, 'content', 'pt.json'));
  const lqipPath = path.join(SRC, 'content', 'img-lqip.json');
  const lqip = fs.existsSync(lqipPath) ? readJSON(lqipPath) : {};
  const preloadFonts = readJSON(path.join(SRC, 'assets', 'fonts', 'preload.json'));

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  // preload.json is build metadata, not a runtime asset; CREDITS.md is the client's
  // shot list; source/ holds the original photos the pipeline eats.
  fs.rmSync(path.join(DIST, 'assets', 'fonts', 'preload.json'), { force: true });
  fs.rmSync(path.join(DIST, 'assets', 'img', 'CREDITS.md'), { force: true });
  fs.rmSync(path.join(DIST, 'assets', 'img', 'source'), { recursive: true, force: true });
  // The raw Reels are the transcoder's input (~12MB no page references) and the brand
  // folder is design source — mark.svg is inlined at build, nothing links the files.
  fs.rmSync(path.join(DIST, 'assets', 'video', 'source'), { recursive: true, force: true });
  fs.rmSync(path.join(DIST, 'assets', 'brand'), { recursive: true, force: true });

  // Icons belong at the root, not under /assets.
  const missingIcons = ICONS.filter((f) => !fs.existsSync(path.join(SRC, 'assets', 'icons', f)));
  if (missingIcons.length) {
    throw new Error(
      `Missing icon(s): ${missingIcons.join(', ')}. Run \`npm run icons\` (scripts/make-icons.js).`
    );
  }
  for (const f of ICONS) fs.copyFileSync(path.join(SRC, 'assets', 'icons', f), path.join(DIST, f));
  fs.rmSync(path.join(DIST, 'assets', 'icons'), { recursive: true, force: true });

  const cssHash = hash(fs.readFileSync(path.join(SRC, 'assets', 'css', 'styles.css'), 'utf8'));
  const jsHash = hash(fs.readFileSync(path.join(SRC, 'assets', 'js', 'main.js'), 'utf8'));

  const html = render({ t, site, lqip, preloadFonts, cssHash, jsHash });
  fs.writeFileSync(path.join(DIST, 'index.html'), html);

  fs.writeFileSync(path.join(DIST, 'site.webmanifest'), manifest(site, t));
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap(site));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robots(site));
  fs.writeFileSync(path.join(DIST, '_headers'), headers);

  /* report */
  console.log(`\nBuilt in ${Date.now() - t0}ms\n`);
  console.log(`  ${'index.html'.padEnd(18)} ${(Buffer.byteLength(html) / 1024).toFixed(1).padStart(6)} KB`);
  for (const dir of ['css', 'js', 'fonts', 'img']) {
    console.log(
      `  ${`assets/${dir}`.padEnd(18)} ${(dirSize(path.join(DIST, 'assets', dir)) / 1024).toFixed(1).padStart(6)} KB`
    );
  }

  const warnings = audit(site, lqip);
  if (warnings.length) {
    console.log(`\n  ${warnings.length} content warning(s) — safe to ignore while in development:`);
    warnings.forEach((w) => console.log(`   ! ${w}`));
  }
  console.log('');
}

build();
