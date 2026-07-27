#!/usr/bin/env node
/**
 * Extracts the official mark and builds the favicon / touch-icon set from it.
 *
 * The client's real logo arrived as Inkscape SVGs (src/assets/brand/). The mark —
 * car silhouette + water drop + sparkles — is vector paths, but the wordmark is live
 * <text> in Rubik, and the page area includes it, so the raw file can't be dropped
 * into a favicon as-is. This script:
 *
 *   1. strips the <text> nodes (and Inkscape/sodipodi cruft) from the original,
 *   2. rasterises what's left and asks sharp to trim it, which yields the mark's
 *      tight bounding box without anyone doing path math by hand,
 *   3. writes src/assets/brand/mark.svg with that tight viewBox (single source of
 *      truth for the inline header/footer logo), and
 *   4. renders the favicon set: white car + brand-cyan accents on the site's ink.
 *
 * Usage: node scripts/make-icons.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRAND = path.resolve(__dirname, '..', 'src', 'assets', 'brand');
const OUT = path.resolve(__dirname, '..', 'src', 'assets', 'icons');

const BG = { r: 0x07, g: 0x09, b: 0x0d }; // --ink-950, matches <meta name="theme-color">

// Brand colours as they appear in the source file.
const NAVY = '#053359';
const NAVY2 = '#0d426f';
const CYAN = '#059fd0';

/** The original SVG with wordmark and editor metadata removed — paths only. */
function pathsOnly(svg) {
  return svg
    .replace(/<text[\s\S]*?<\/text>/g, '')
    // path60/path61 are the cyan rules flanking "AUTO DETAILING" — part of the text
    // lockup, not the mark, so they go with it.
    .replace(/<path[^>]*id="path6[01]"[^>]*\/>/g, '')
    .replace(/<sodipodi:namedview[\s\S]*?<\/sodipodi:namedview>/g, '')
    .replace(/<defs[\s\S]*?<\/defs>/g, '');
}

async function extractMark() {
  const raw = fs.readFileSync(path.join(BRAND, 'logo-original.svg'), 'utf8');
  const stripped = pathsOnly(raw);

  // Render wide, then let trim() find the ink. Map pixel offsets back to user units.
  const W = 2000;
  const vb = raw.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
  const [vbX, vbY, vbW, vbH] = vb;
  const H = Math.round((W * vbH) / vbW);

  const { info } = await sharp(Buffer.from(stripped), { density: 300 })
    .resize(W, H)
    .png()
    .toBuffer({ resolveWithObject: true })
    .then(({ data }) =>
      sharp(data).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true })
    );

  const scale = vbW / W;
  // trim() reports negative offsets: the amount removed from left/top.
  const x = vbX + -info.trimOffsetLeft * scale;
  const y = vbY + -info.trimOffsetTop * scale;
  const w = info.width * scale;
  const h = info.height * scale;

  // Small breathing margin so strokes are not clipped at the box edge.
  const pad = Math.max(w, h) * 0.015;
  const viewBox = `${(x - pad).toFixed(3)} ${(y - pad).toFixed(3)} ${(w + 2 * pad).toFixed(3)} ${(h + 2 * pad).toFixed(3)}`;

  // Rebuild a minimal SVG: same path content, tight viewBox, no width/height so it
  // scales to its container when inlined.
  const inner = stripped
    .replace(/^[\s\S]*?<svg[\s\S]*?>/, '') // drop XML prolog, comments and the opening tag
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s(?:inkscape|sodipodi):[a-zA-Z-]+="[^"]*"/g, '')
    .replace(/\sxmlns:(?:inkscape|sodipodi|xlink)="[^"]*"/g, '');

  const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`;
  fs.writeFileSync(path.join(BRAND, 'mark.svg'), mark);
  console.log(`  mark.svg  viewBox ${viewBox}`);
  return mark;
}

/** Recolour the navy car for dark surfaces; the cyan accents stay brand cyan. */
const onDark = (svg) =>
  svg.split(NAVY2).join('#e6ebf2').split(NAVY).join('#ffffff').split(CYAN).join(CYAN);

const roundedMask = (size, radius) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );

/**
 * @param {string} markSvg
 * @param {number} size
 * @param {{radius?: number, pad?: number}} opts
 */
async function icon(markSvg, size, { radius = 0, pad = 0.14 } = {}) {
  const inner = Math.round(size * (1 - pad * 2));
  const resized = await sharp(Buffer.from(onDark(markSvg)), { density: 300 })
    .resize(inner, inner, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  let img = sharp({
    create: { width: size, height: size, channels: 4, background: { ...BG, alpha: 1 } },
  }).composite([{ input: resized, gravity: 'centre' }]);

  if (radius > 0) {
    img = sharp(await img.png().toBuffer()).composite([
      { input: roundedMask(size, radius), blend: 'dest-in' },
    ]);
  }
  return img.png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const mark = await extractMark();

  const files = [
    // Browser tab. Rounded, tighter padding so the mark reads small. The mark is a
    // wide car silhouette, so favicons keep more horizontal presence than a square
    // glyph would.
    ['favicon-32.png', 32, { radius: 6, pad: 0.08 }],
    ['favicon-48.png', 48, { radius: 9, pad: 0.08 }],
    ['favicon-96.png', 96, { radius: 18, pad: 0.1 }],
    // iOS home screen. Full-bleed square — iOS applies its own mask.
    ['apple-touch-icon.png', 180, { radius: 0, pad: 0.16 }],
    // PWA manifest. 'maskable' safe zone is the centre 80%.
    ['icon-192.png', 192, { radius: 0, pad: 0.18 }],
    ['icon-512.png', 512, { radius: 0, pad: 0.18 }],
  ];

  for (const [name, size, opts] of files) {
    const buf = await icon(mark, size, opts);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log(`  ${name.padEnd(22)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
  console.log(`\nIcons -> ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error('Icon generation failed:', e.message);
  process.exit(1);
});
