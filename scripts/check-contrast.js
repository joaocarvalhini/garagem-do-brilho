#!/usr/bin/env node
/**
 * WCAG 2.1 contrast audit for the palette.
 *
 * The brand is black, blue and white, and the site is dark-primary — which is the
 * combination most likely to fail quietly. Blue is the darkest of the hues at equal
 * lightness, so a blue that looks vivid on black is often nowhere near 4.5:1, and a
 * blue button with white text is the classic offender. Hence this gate.
 *
 * Run: node scripts/check-contrast.js
 * Exits non-zero if any declared pair misses its target.
 */
const P = {
  // Black — never pure #000. On OLED, pure black smears on scroll, and it makes the
  // blue accent look like it is floating in a hole rather than sitting on a surface.
  'ink-950': '#07090D',
  'ink-900': '#0B0E14',
  'ink-850': '#10141C',
  'ink-800': '#161C26',
  'ink-700': '#222B39',

  // White + the mist ramp for text on dark.
  white: '#FFFFFF',
  'mist-100': '#E6EBF2',
  'mist-300': '#AFBBCB',

  // Blue. 500 is the logo's own cyan (#059FD0, measured from the vector); 600/700
  // are darker cuts that can carry white text; 300/400 are lighter cuts readable on
  // black. The logo navy (#053359) informs the dark surfaces, not this ramp.
  'azul-300': '#8ED9F7',
  'azul-400': '#2FB5E8',
  'azul-500': '#059FD0',
  'azul-600': '#047AA3',
  'azul-700': '#035E80',

  // Light surfaces, for the sections that invert.
  paper: '#FFFFFF',
  'paper-alt': '#F1F4F9',
  ink: '#0B0E14',
  'ink-muted': '#4A5768',
};

const srgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
};
const lum = (h) => {
  const [r, g, b] = srgb(h);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(P[a] || a), lum(P[b] || b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum, what it is]
//
// Dark surfaces are checked against all three grounds a visitor actually sees
// (ink-950 page, ink-900 alt section, ink-850 card) — a pair that passes on the page
// and fails on the cards is still a failure on half the site.
const PAIRS = [
  // Text on dark
  ['white', 'ink-950', 4.5, 'headings on page background'],
  ['mist-100', 'ink-950', 4.5, 'body text on page background'],
  ['mist-100', 'ink-900', 4.5, 'body text on alt sections'],
  ['mist-100', 'ink-850', 4.5, 'body text on cards'],
  ['mist-300', 'ink-950', 4.5, 'secondary text on page background'],
  ['mist-300', 'ink-900', 4.5, 'secondary text on alt sections'],
  ['mist-300', 'ink-850', 4.5, 'secondary text on cards'],

  // Blue as text on dark — the eyebrow labels, links, active states.
  ['azul-400', 'ink-950', 4.5, 'accent text on page background'],
  ['azul-400', 'ink-900', 4.5, 'accent text on alt sections'],
  ['azul-400', 'ink-850', 4.5, 'accent text on cards'],
  ['azul-300', 'ink-950', 4.5, 'bright accent text on dark'],

  // Blue as non-text UI on dark — rules, borders, focus rings, graphics.
  // 3:1 is the WCAG floor for graphical objects and UI components.
  ['azul-500', 'ink-950', 3.0, 'accent UI/graphic on page background'],
  ['azul-500', 'ink-850', 3.0, 'accent UI/graphic on cards'],

  // Buttons
  ['white', 'azul-600', 4.5, 'text on primary blue button'],
  ['white', 'azul-700', 4.5, 'text on pressed blue button'],
  ['ink-950', 'white', 4.5, 'text on white button'],
  ['ink-950', 'azul-400', 4.5, 'dark text on light-blue button'],

  // Light surfaces
  ['ink', 'paper', 4.5, 'body text on white'],
  ['ink', 'paper-alt', 4.5, 'body text on alt light'],
  ['ink-muted', 'paper', 4.5, 'secondary text on white'],
  ['ink-muted', 'paper-alt', 4.5, 'secondary text on alt light'],
  ['azul-700', 'paper', 4.5, 'accent text on white'],
  ['azul-700', 'paper-alt', 4.5, 'accent text on alt light'],
  ['azul-600', 'paper', 3.0, 'accent UI on white'],
];

let failed = 0;
console.log('\n  ratio   target  result  pair\n  ' + '-'.repeat(76));
for (const [fg, bg, min, label] of PAIRS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(
    `  ${r.toFixed(2).padStart(5)}   ${min.toFixed(1).padStart(4)}    ${ok ? 'PASS' : 'FAIL'}    ${fg} on ${bg} — ${label}`
  );
}
console.log('');
if (failed) {
  console.error(`${failed} pair(s) below target.\n`);
  process.exit(1);
}
console.log('All pairs meet WCAG AA.\n');
