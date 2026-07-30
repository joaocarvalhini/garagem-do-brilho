#!/usr/bin/env node
/**
 * Builds the Open Graph share card — the picture WhatsApp, Facebook and X put next to
 * the link when anyone shares the site.
 *
 * Output: src/assets/icons/og-share.jpg (1200x630), which build.js copies to the site
 * root alongside the favicons. It lives there rather than under /assets/img/ on purpose:
 * that folder is served immutable for a year, and a share image occasionally needs to be
 * replaced and re-scraped.
 *
 * The card is a photograph, not a logo on a colour — a detailing business is sold on how
 * the cars look, and the thumbnail is the only part of a shared link anyone actually
 * looks at. Text is kept to the wordmark plus one line, because WhatsApp renders this at
 * roughly 200px wide and anything smaller than the wordmark is unreadable there.
 *
 * Fonts: rendered from the TTFs in src/assets/brand/fonts/ via a fontconfig file written
 * at run time, so the wordmark comes out in the real Rubik italic instead of whatever
 * the machine happens to have. Those TTFs are build-time only — build.js strips the
 * whole brand/ folder out of dist/, so they are never served to a browser.
 *
 * The output is committed. Cloudflare installs with --omit=dev and has no sharp, so this
 * never runs there; it runs here, when the photo or the wording changes.
 *
 * Usage: npm run og
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHOTO = path.join(ROOT, 'src', 'assets', 'img', 'source', 'hero.jpg');
const MARK = path.join(ROOT, 'src', 'assets', 'brand', 'mark.svg');
const FONT_DIR = path.join(ROOT, 'src', 'assets', 'brand', 'fonts');
const OUT = path.join(ROOT, 'src', 'assets', 'icons', 'og-share.jpg');

const W = 1200;
const H = 630;

/**
 * librsvg finds fonts through fontconfig, which reads FONTCONFIG_PATH from the real
 * process environment when its library initialises — assigning process.env inside Node
 * before require('sharp') is too late and silently does nothing. The failure is quiet
 * and easy to ship: the wordmark comes out in Rubik while the line under it renders in
 * DejaVu Mono, because a partially-initialised fontconfig still answers the first few
 * lookups.
 *
 * So the script re-executes itself once with the variable set properly. The cache lives
 * in .tmp/ (gitignored) and persists between runs.
 */
const FC_DIR = path.join(ROOT, '.tmp', 'fontconfig');

function ensureFontEnv() {
  if (!fs.existsSync(FONT_DIR)) return false;
  if (process.env.FONTCONFIG_PATH === FC_DIR) return true;

  fs.mkdirSync(path.join(FC_DIR, 'cache'), { recursive: true });
  fs.writeFileSync(
    path.join(FC_DIR, 'fonts.conf'),
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>` +
      `<dir>${FONT_DIR.replace(/\\/g, '/')}</dir>` +
      `<cachedir>${path.join(FC_DIR, 'cache').replace(/\\/g, '/')}</cachedir>` +
      `</fontconfig>`
  );
  const run = require('child_process').spawnSync(
    process.execPath,
    [__filename, ...process.argv.slice(2)],
    { env: { ...process.env, FONTCONFIG_PATH: FC_DIR }, stdio: 'inherit' }
  );
  process.exit(run.status === null ? 1 : run.status);
}

const hasFonts = ensureFontEnv();
const sharp = require('sharp');

/** Fail loudly rather than shipping a card in the wrong typeface. */
async function assertBrandFont() {
  if (!hasFonts) return;
  const svg = (family) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="60">` +
        `<rect width="900" height="60" fill="#fff"/>` +
        `<text x="0" y="40" font-family="${family}" font-weight="700" font-size="30" fill="#000">automóvel · Marinha</text></svg>`,
      'utf8'
    );
  /* Compare the two brand families against each other, not against a made-up name: with
     only these two faces on the fontconfig path an unresolvable name falls back to one of
     them, so "unknown family matches brand family" is the normal result and proves
     nothing. Rubik and Space Grotesk are genuinely different shapes — identical pixels
     mean both landed in the same fallback face. */
  const [grotesk, rubik] = await Promise.all(
    ['Space Grotesk Light', 'Rubik Light'].map((f) => sharp(svg(f)).raw().toBuffer())
  );
  if (Buffer.compare(grotesk, rubik) === 0) {
    throw new Error(
      'brand font did not load — text would render in the fontconfig fallback face. ' +
        `Check ${path.relative(ROOT, FONT_DIR)} and delete .tmp/fontconfig to rebuild the cache.`
    );
  }
}

/* The mark is white-on-transparent artwork; its own fill is the brand navy, so it gets
   recoloured here rather than keeping a second copy of the file. */
function markSvg(height) {
  const raw = fs.readFileSync(MARK, 'utf8');
  const vb = raw.match(/viewBox="([^"]+)"/);
  if (!vb) throw new Error('mark.svg has no viewBox');
  const [, , vw, vh] = vb[1].split(/\s+/).map(Number);
  const width = Math.round((vw / vh) * height);
  const body = raw
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/\swidth="[^"]*"/, '')
    .replace(/\sheight="[^"]*"/, '')
    /* Inkscape writes colour into style="fill:#rrggbb", not a fill attribute — matching
       only the attribute is why the first pass came out in brand navy on a dark photo. */
    .replace(/fill:#[0-9a-f]{3,6}/gi, 'fill:#ffffff')
    .replace(/fill="(?!none)#[^"]*"/g, 'fill="#ffffff"');
  return { buf: Buffer.from(body.replace('<svg', `<svg width="${width}" height="${height}"`)), width };
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main() {
  if (!fs.existsSync(PHOTO)) {
    console.error(`Share card needs ${path.relative(ROOT, PHOTO)} — not found. Nothing written.`);
    process.exit(1);
  }
  if (!hasFonts) {
    console.warn('  ! brand fonts missing; the wordmark will fall back to a system face.');
  }
  await assertBrandFont();

  const meta = await sharp(PHOTO).metadata();
  /* Crop to 1200x630 around the same focal point the hero uses, so the share card and
     the page a visitor lands on show the same car in the same framing. */
  let cw = meta.width;
  let ch = Math.round(cw / (W / H));
  if (ch > meta.height) {
    ch = meta.height;
    cw = Math.round(ch * (W / H));
  }
  const base = await sharp(PHOTO)
    .extract({
      left: Math.round((meta.width - cw) / 2),
      top: Math.max(0, Math.min(meta.height - ch, Math.round((meta.height - ch) * 0.42))),
      width: cw,
      height: ch,
    })
    .resize(W, H)
    .toBuffer();

  const mark = markSvg(80);
  const PAD = 64;
  const markTop = H - PAD - 150;
  const wordmarkY = H - PAD - 74;

  /* The scrim has to survive a bright photograph — this one is a silver car in full sun,
     and the first pass left the strapline sitting on a lit wheel arch. Bottom band is
     near-solid; the top two thirds stay clear so the car still sells the link. */
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#05070b" stop-opacity="0"/>
      <stop offset="26%" stop-color="#05070b" stop-opacity="0.62"/>
      <stop offset="52%" stop-color="#05070b" stop-opacity="0.90"/>
      <stop offset="76%" stop-color="#05070b" stop-opacity="0.97"/>
      <stop offset="100%" stop-color="#05070b" stop-opacity="0.99"/>
    </linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#05070b" stop-opacity="0.70"/>
      <stop offset="50%" stop-color="#05070b" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#05070b" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#side)"/>
  <rect y="${Math.round(H * 0.3)}" width="${W}" height="${Math.round(H * 0.7)}" fill="url(#foot)"/>

  <text x="${PAD + mark.width + 24}" y="${wordmarkY}" font-family="Rubik Light" font-style="italic"
        font-weight="700" font-size="58" letter-spacing="-0.5" fill="#ffffff">GARAGEM DO BRILHO</text>
  <text x="${PAD + mark.width + 28}" y="${wordmarkY + 32}" font-family="Space Grotesk Light"
        font-weight="700" font-size="19" letter-spacing="7" fill="#2fb5e8">AUTO DETAILING</text>

  <text x="${PAD}" y="${H - PAD + 4}" font-family="Space Grotesk Light" font-weight="700"
        font-size="27" fill="#e6ebf2">${esc('Limpeza de detalhe automóvel · Marinha Grande')}</text>

  <!-- Top-right, not bottom-right: at the bottom it landed on top of the strapline. -->
  <g transform="translate(${W - PAD - 330}, ${PAD - 18})">
    <rect x="0" y="0" width="330" height="48" rx="24" fill="#05070b" fill-opacity="0.62"
          stroke="#2fb5e8" stroke-opacity="0.55"/>
    <text x="165" y="31" text-anchor="middle" font-family="Space Grotesk Light" font-weight="700"
          font-size="19" fill="#8ed9f7">${esc('Recolha e entrega incluídas')}</text>
  </g>
</svg>`);

  const out = await sharp(base)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: mark.buf, top: markTop, left: PAD },
    ])
    /* JPEG, not WebP or AVIF: WhatsApp and several link-preview scrapers still refuse
       anything else, and this image exists solely for them. */
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4' })
    .toBuffer();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out);
  console.log(`\n  og-share.jpg  ${W}x${H}  ${(out.length / 1024).toFixed(0)} KB`);
  console.log(`  -> ${path.relative(ROOT, OUT)}\n`);
}

main().catch((e) => {
  console.error('Share card failed:', e.message);
  process.exit(1);
});
