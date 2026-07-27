/**
 * Inline SVG icon set (Lucide, ISC licensed — https://lucide.dev).
 *
 * Inlined rather than pulled from an icon font or sprite sheet: no extra request,
 * no FOUT, and each icon inherits currentColor so it themes for free.
 *
 * Every icon here is decorative — each one sits beside a text label — so they carry
 * aria-hidden and the accessible name comes from the label. If you ever use one alone
 * in a button, give the button an aria-label.
 *
 * Stroke width is a consistent 2 across the set (icon-style-consistent), and the set
 * is outline-only: no filled/outline mixing at the same level.
 */

const svg = (paths, { size = 24, fill = false } = {}) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${
    fill ? 'currentColor' : 'none'
  }" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" ` +
  `stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const icons = {
  /* --- generic UI --- */
  check: () => svg('<path d="M20 6 9 17l-5-5"/>'),
  arrowRight: () => svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  arrowUp: () => svg('<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>'),
  chevronDown: () => svg('<path d="m6 9 6 6 6-6"/>'),
  menu: () => svg('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'),
  x: () => svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  clock: () => svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  mapPin: () =>
    svg(
      '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
    ),
  calendar: () =>
    svg('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'),
  moveHorizontal: () => svg('<path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><path d="m6 8-4 4 4 4"/>'),
  instagram: () =>
    svg(
      '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>'
    ),
  whatsapp: () => svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'),
  facebook: () =>
    svg('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
  play: () => svg('<path d="M6 3.5 20 12 6 20.5z"/>', { fill: true }),
  pause: () =>
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">` +
    `<rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>`,

  /* --- vehicle tiers --- */
  car: () =>
    svg(
      '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'
    ),
  carFront: () =>
    svg(
      '<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/>'
    ),
  truck: () =>
    svg(
      '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'
    ),

  /* --- the work itself --- */
  droplet: () =>
    svg('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'),
  sparkles: () =>
    svg(
      '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>'
    ),
  // Bancos / estofos / peles.
  seat: () =>
    svg(
      '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/><path d="M5 18v2"/><path d="M19 18v2"/>'
    ),
  // Aspiração / vapor.
  vacuum: () =>
    svg('<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>'),
  // Compartimento do motor.
  engine: () =>
    svg(
      '<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/>'
    ),
  // Descontaminação + proteção em cera — the Detalhada.
  shieldShine: () =>
    svg(
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'
    ),
  ticket: () =>
    svg(
      '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>'
    ),

  /**
   * Brand mark — the official one: car silhouette + water drop + sparkles, extracted
   * from the client's vector logo by scripts/make-icons.js into brand/mark.svg
   * (wordmark stripped, viewBox tightened). The navy fills are swapped for
   * currentColor so the mark themes with its surroundings; the cyan accents are the
   * brand cyan and stay put. The mark is wide (~3.4:1), so `size` sets the HEIGHT.
   */
  logo: ({ size = 32 } = {}) => {
    if (!logoCache) {
      const raw = require('fs').readFileSync(
        require('path').join(__dirname, '..', 'assets', 'brand', 'mark.svg'),
        'utf8'
      );
      logoCache = raw
        .split('#0d426f').join('currentColor')
        .split('#053359').join('currentColor')
        .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
    }
    return logoCache.replace('<svg ', `<svg height="${size}" `);
  },
};

let logoCache = null;

/**
 * @param {keyof typeof icons} name
 * @param {{size?: number, class?: string}} [opts]
 */
function icon(name, opts = {}) {
  const fn = icons[name];
  if (!fn) throw new Error(`Unknown icon: ${name}`);
  let out = fn(opts);
  if (opts.size) out = out.replace(/width="\d+" height="\d+"/, `width="${opts.size}" height="${opts.size}"`);
  if (opts.class) out = out.replace('<svg ', `<svg class="${opts.class}" `);
  return out;
}

module.exports = { icon, icons };
