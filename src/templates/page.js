/**
 * Page template — renders the whole site as one function of (content, site data).
 *
 * Server-side string templating, same approach as the Joaquim Pinto site this
 * pipeline came from: no runtime framework, the browser receives finished HTML.
 * Anything dynamic (tier prices, the before/after slider) is carried as data-*
 * attributes and picked up by main.js — but the markup renders complete with the
 * Citadino tier baked in, so the page is whole before (or without) any JS.
 */
const fs = require('fs');
const path = require('path');
const { icon } = require('../lib/icons.js');

/** Reels present in src/assets/video/ — the template only writes cards for videos
 * that actually exist, so a missing transcode never ships a broken <video>. */
const VIDEO_DIR = path.join(__dirname, '..', 'assets', 'video');
const reelExists = (name) =>
  fs.existsSync(path.join(VIDEO_DIR, `${name}.mp4`)) &&
  fs.existsSync(path.join(VIDEO_DIR, `${name}.webp`));

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** JSON for a data-* attribute: single quotes in the attribute, so JSON's own double
 * quotes survive without a forest of &quot;. */
const dataJSON = (obj) => esc(JSON.stringify(obj)).replace(/&quot;/g, '"');

const eur = (n) =>
  new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const dur = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

/**
 * Responsive <picture> from the processed image set, or null when the photo was never
 * supplied — callers decide the fallback, because the right fallback differs per slot.
 */
/**
 * @param {{eager?: boolean, lazy?: boolean}} opts
 *   eager — above the fold: skip lazy loading AND ask for priority (hero only).
 *   lazy  — set false to skip lazy loading without claiming priority. The
 *           before/after layers need this: they are stacked and clip-path'd, and at
 *           least one engine never fires the lazy load for the covered layer, which
 *           left the "depois" image permanently unloaded and the slider dead. A
 *           comparison is meaningless with one half missing, so it always loads.
 */
function picture(name, spec, { lqip, alt, sizes, eager = false, lazy = true, className = '' }) {
  if (!lqip[name]) return null;
  const widths = spec.widths;
  const srcset = (fmt) => widths.map((w) => `/assets/img/${name}-${w}.${fmt} ${w}w`).join(', ');
  const largest = widths[widths.length - 1];
  const loadAttrs = eager
    ? 'fetchpriority="high"'
    : lazy
      ? 'loading="lazy" decoding="async"'
      : 'decoding="async"';
  return `<picture${className ? ` class="${className}"` : ''}>
    <source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
    <img src="/assets/img/${name}-${largest}.webp" alt="${esc(alt)}"
      width="${largest}" height="${Math.round(largest / spec.ar)}"
      ${loadAttrs}
      style="background-image:url(${lqip[name]});background-size:cover">
  </picture>`;
}

/* Image specs mirrored from scripts/process-images.js — only what the template needs
 * to write srcset/sizes. If widths change there, change them here. */
const IMG = {
  'hero-car': { widths: [768, 1280, 1920], ar: 16 / 9 },
  'band-garage': { widths: [1024, 1600, 2400], ar: 21 / 9 },
  'about-owner': { widths: [480, 960], ar: 1 },
  'pack-simples': { widths: [480, 960], ar: 4 / 3 },
  'pack-completa-texteis': { widths: [480, 960], ar: 4 / 3 },
  'pack-completa-peles': { widths: [480, 960], ar: 4 / 3 },
  'pack-detalhada': { widths: [480, 960], ar: 4 / 3 },
  'ba-01-durante': { widths: [640, 1280], ar: 4 / 5 },
  'ba-01-depois': { widths: [640, 1280], ar: 4 / 5 },
};

/* ---------- sections ---------- */

function head({ t, site, lqip, preloadFonts, cssHash, jsHash }) {
  const { company, contact } = site;
  const addr = contact.address;

  // LocalBusiness JSON-LD. Only facts that are actually known — no invented hours.
  // An AutoWash with a booking URL is exactly what local search wants from this
  // business.
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'AutoWash',
    name: company.name,
    description: t.meta.description,
    url: `${site.site.domain}/`,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.street,
      postalCode: addr.postalCode,
      addressLocality: addr.locality,
      addressRegion: addr.region,
      addressCountry: addr.country,
    },
    ...(contact.geo.lat != null && contact.geo.lng != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: contact.geo.lat,
            longitude: contact.geo.lng,
          },
        }
      : {}),
    // Ties the site to the Google Business Profile, which is what actually ranks
    // in the local map pack.
    ...(addr.maps ? { hasMap: addr.maps } : {}),
    areaServed: site.serviceArea.map((a) => ({ '@type': 'City', name: a })),
    sameAs: [contact.instagram, contact.facebook, contact.profile].filter(Boolean),
    potentialAction: {
      '@type': 'ReserveAction',
      target: { '@type': 'EntryPoint', urlTemplate: contact.booking },
    },
    priceRange: '€€',
  };

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.meta.title)}</title>
<meta name="description" content="${esc(t.meta.description)}">
<link rel="canonical" href="${site.site.domain}/">
<meta name="theme-color" content="${site.site.themeColor}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t.meta.title)}">
<meta property="og:description" content="${esc(t.meta.description)}">
<meta property="og:url" content="${site.site.domain}/">
<meta property="og:locale" content="${site.site.locale}">
<meta property="og:site_name" content="${esc(company.name)}">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="icon" href="/favicon-48.png" sizes="48x48">
<link rel="icon" href="/favicon-96.png" sizes="96x96">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${preloadFonts
      .map((f) => `<link rel="preload" href="/assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`)
      .join('\n')}
<link rel="stylesheet" href="/assets/css/styles.css?v=${cssHash}">
<script defer src="/assets/js/main.js?v=${jsHash}"></script>
<!--
  The .js class gates every rule that hides something before it animates in. Setting it
  here (rather than from main.js) is what avoids a flash of un-hidden content — but it
  also means a main.js that never arrives would leave the page permanently blank. The
  timer is the insurance: main.js clears it as its first act, so it only ever fires if
  the script genuinely failed, and the page falls back to fully visible.
-->
<script>var d=document.documentElement;d.classList.add('js');window.__gbFail=setTimeout(function(){d.classList.remove('js')},4000)</script>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;
}

function header({ t, site }) {
  // The packs section now carries the prices too, so "Serviços" is the single entry
  // for it — a separate "Preços" tab would be a second link to the same cards. The
  // price intent is still served by the hero's "Ver preços" button and the sticky bar.
  const links = [
    ['packs', t.nav.packs],
    ['processo', t.nav.process],
    ['trabalhos', t.nav.work],
    ['sobre', t.nav.about],
    ['contactos', t.nav.contact],
  ];

  const brand = `<a class="brand" href="#top" aria-label="${esc(site.company.name)} — ${t.footer.backToTop}">
    ${icon('logo')}
    <span class="brand__name">${esc(site.company.name)}
      <span class="brand__sub">${esc(site.company.lockupSub)}</span>
    </span>
  </a>`;

  return `<header class="header" data-header>
  <div class="container header__inner">
    ${brand}
    <nav class="nav" aria-label="Principal">
      ${links.map(([id, label]) => `<a class="nav__link" data-spy href="#${id}">${esc(label)}</a>`).join('\n      ')}
    </nav>
    <a class="btn btn--primary header__cta" href="${site.contact.booking}" rel="noopener">${esc(t.nav.book)}${icon('arrowRight')}</a>
    <button class="burger" data-burger aria-expanded="false" aria-controls="menu" aria-label="${esc(t.nav.menuOpen)}">
      ${icon('menu')}
    </button>
  </div>
</header>

<div class="menu" id="menu" data-menu>
  <div class="container menu__head">
    ${brand}
    <button class="burger" data-menu-close aria-label="${esc(t.nav.menuClose)}">${icon('x')}</button>
  </div>
  <nav class="container menu__nav" aria-label="Menu">
    ${links
      .map(([id, label], i) => `<a class="menu__link" style="--i:${i}" href="#${id}">${esc(label)}</a>`)
      .join('\n    ')}
  </nav>
  <div class="container menu__foot">
    <a class="btn btn--primary btn--lg btn--block" href="${site.contact.booking}" rel="noopener">${esc(t.nav.book)}${icon('arrowRight')}</a>
  </div>
</div>`;
}

function hero({ t, site, lqip }) {
  const img = picture('hero-car', IMG['hero-car'], {
    lqip,
    alt: t.hero.imgAlt,
    sizes: '100vw',
    eager: true,
  });

  // The title splits on the last two words so "de novo" lands in italic blue — the
  // shine inside the sentence.
  const words = t.hero.title.split(' ');
  const tail = words.splice(-3).join(' ');

  return `<section class="hero" id="top">
  ${img ? `<div class="hero__media" data-parallax>${img}</div>` : '<div class="hero__glow" aria-hidden="true"></div>'}
  <div class="container hero__inner">
    <p class="eyebrow">${esc(t.hero.eyebrow)}</p>
    <h1 class="hero__title">${esc(words.join(' '))} <em>${esc(tail)}</em></h1>
    <p class="hero__lead">${esc(t.hero.lead)}</p>
    <div class="btn-row hero__actions">
      <a class="btn btn--primary btn--lg" href="${site.contact.booking}" rel="noopener">${esc(t.hero.ctaPrimary)}${icon('arrowRight')}</a>
      <a class="btn btn--ghost btn--lg" href="#packs">${esc(t.hero.ctaSecondary)}</a>
    </div>
    <p class="hero__pickup">
      <span class="hero__pickup-icon">${icon('truck')}</span>
      <span>
        <strong class="hero__pickup-title">${esc(t.hero.pickupStrong)}</strong>
        <span class="hero__pickup-text">${esc(t.hero.pickup)}</span>
      </span>
    </p>
  </div>
  <span class="hero__scroll" aria-hidden="true">${esc(t.hero.scroll)}</span>
</section>`;
}

/** Pack card data-* payload: prices/durations per tier plus per-tier include lists,
 * only where they genuinely differ. */
function packPayload(pack) {
  const payload = { tiers: pack.tiers, includesDefault: pack.includes };
  if (pack.includesOverride) {
    payload.includes = {};
    for (const [tier, list] of Object.entries(pack.includesOverride)) payload.includes[tier] = list;
  }
  return payload;
}

function tierSelector({ t, site, idPrefix }) {
  const icons = { citadino: 'car', familiar: 'carFront', suv: 'truck' };
  return `<fieldset class="tiers__set">
      <legend class="tiers__label">${esc(t.pricing.selectorLabel)}</legend>
      ${site.vehicles
      .map(
        (v, i) => `<label class="tier">
        <input type="radio" name="${idPrefix}-tier" value="${v.id}" data-tier data-tier-name="${esc(v.name)}" ${i === 0 ? 'checked' : ''}>
        <span class="tier__box">
          ${icon(icons[v.id])}
          <span>
            <span class="tier__name">${esc(v.name)}</span>
            <span class="tier__desc">${esc(v.desc)}</span>
            <span class="tier__eg">${esc(t.pricing.examplesLabel)}: ${esc(v.examples)}</span>
          </span>
        </span>
      </label>`
      )
      .join('\n      ')}
    </fieldset>`;
}

function packs({ t, site, lqip }) {
  const defaultTier = site.vehicles[0].id;

  const card = (pack, n) => {
    const tier = pack.tiers[defaultTier];
    const includes = (pack.includesOverride && pack.includesOverride[defaultTier]) || pack.includes;
    const imgName = `pack-${pack.id}`;
    const img =
      IMG[imgName] &&
      picture(imgName, IMG[imgName], {
        lqip,
        alt: `${pack.name}${pack.variant ? ` (${pack.variant})` : ''}`,
        sizes: '(min-width: 68rem) 25vw, (min-width: 40rem) 50vw, 100vw',
      });

    return `<article class="card pack${pack.featured ? ' is-featured' : ''}" data-reveal="${n}" data-pack='${dataJSON(packPayload(pack))}'>
      ${pack.featured ? `<span class="pack__badge">${esc(t.packs.featuredLabel)}</span>` : ''}
      ${img ? `<div class="pack__media">${img}</div>` : `<span class="pack__icon">${icon(pack.icon)}</span>`}
      <h3 class="pack__name">${esc(pack.name)}${pack.variant ? `<span class="pack__variant">${esc(pack.variant)}</span>` : ''}</h3>
      <p class="pack__blurb">${esc(pack.blurb)}</p>
      <p class="pack__price">
        <span class="pack__amount" data-amount>${eur(tier.price)}</span>
        <span class="pack__dur">· <span data-dur>${dur(tier.minutes)}</span></span>
      </p>
      <ul class="pack__includes" data-includes>
        ${includes.map((s) => `<li>${icon('check')}<span>${esc(s)}</span></li>`).join('\n        ')}
      </ul>
      <p class="pack__foot">
        <a class="btn btn--ghost btn--block" href="${site.contact.booking}" rel="noopener">${esc(t.packs.cta)}</a>
      </p>
    </article>`;
  };

  return `<section class="section" id="packs">
  <div class="container">
    <div class="section__head" data-reveal>
      <p class="eyebrow">${esc(t.packs.eyebrow)}</p>
      <h2 class="section__title">${esc(t.packs.title)}</h2>
      <p class="section__lead">${esc(t.packs.lead)}</p>
    </div>
    <div class="tiers" data-reveal>
      ${tierSelector({ t, site, idPrefix: 'packs' })}
      <p class="tiers__label" style="margin-top:var(--s-3);margin-bottom:0">${esc(t.pricing.selectorHint)}</p>
    </div>
    <div class="packs__grid">
      ${site.packs.map(card).join('\n      ')}
    </div>
    <p class="packs__note">${esc(t.pricing.note)}</p>
    <p class="visually-hidden" role="status" aria-live="polite" data-price-live></p>
    <div class="packs__cta" data-reveal>
      <a class="btn btn--primary btn--lg" href="${site.contact.booking}" rel="noopener">${esc(t.pricing.cta)}${icon('arrowRight')}</a>
    </div>
  </div>
</section>`;
}

function extras({ t, site }) {
  const priceLabel = (x) =>
    x.priceFrom === x.priceTo
      ? fill(t.extras.priceFixed, { price: eur(x.priceFrom) })
      : fill(t.extras.priceRange, { from: eur(x.priceFrom), to: eur(x.priceTo) });

  return `<section class="section section--alt">
  <div class="container">
    <div class="section__head" data-reveal>
      <p class="eyebrow">${esc(t.extras.eyebrow)}</p>
      <h2 class="section__title">${esc(t.extras.title)}</h2>
      <p class="section__lead">${esc(t.extras.lead)}</p>
    </div>
    <div class="extras__grid">
      ${site.extras
      .map(
        (x, n) => `<article class="card extra" data-reveal="${n}">
        <span class="extra__icon">${icon(x.icon)}</span>
        <h3 class="extra__name">${esc(x.name)}</h3>
        <p class="extra__meta">
          <span class="extra__price">${priceLabel(x)}</span>
          <span class="extra__dur">· ${dur(x.minutes)}</span>
        </p>
        <p class="extra__note">${esc(x.note)}</p>
      </article>`
      )
      .join('\n      ')}
    </div>
    <div class="btn-row" style="margin-top:var(--s-6)" data-reveal>
      <a class="btn btn--ghost" href="${site.contact.booking}" rel="noopener">${esc(t.extras.cta)}${icon('arrowRight')}</a>
    </div>

    <div class="voucher" style="margin-top:var(--s-8)" data-reveal>
      <div>
        <p class="eyebrow">${esc(t.voucher.eyebrow)}</p>
        <h3 class="voucher__title">${esc(t.voucher.title)}</h3>
        <p class="voucher__lead">${esc(t.voucher.lead)}</p>
        <p class="voucher__meta">${icon('ticket')} ${esc(site.voucher.kind)}</p>
        <div class="btn-row voucher__actions">
          <a class="btn btn--primary" href="${site.contact.profile}" rel="noopener">${esc(t.voucher.cta)}${icon('arrowRight')}</a>
        </div>
        <p class="voucher__fine">${esc(t.voucher.note)}</p>
      </div>
      <div class="voucher__figures">
        <span class="voucher__col">
          <span class="voucher__k">${esc(t.voucher.before)}</span>
          <span class="voucher__before">${eur(site.voucher.priceBefore)}</span>
        </span>
        <span class="voucher__col">
          <span class="voucher__k">${esc(t.voucher.now)}</span>
          <span class="voucher__now">${eur(site.voucher.price)}</span>
        </span>
        <span class="voucher__save">${esc(fill(t.voucher.save, { percent: site.voucher.savePercent }))}</span>
      </div>
    </div>
  </div>
</section>`;
}

function process({ t }) {
  return `<section class="section" id="processo">
  <div class="container">
    <div class="section__head" data-reveal>
      <p class="eyebrow">${esc(t.process.eyebrow)}</p>
      <h2 class="section__title">${esc(t.process.title)}</h2>
      <p class="section__lead">${esc(t.process.lead)}</p>
    </div>
    <ol class="steps" style="padding:0;list-style:none">
      ${t.process.steps
      .map(
        (s, n) => `<li class="step" data-step data-reveal="${n}">
        <span class="step__n" aria-hidden="true"></span>
        <h3 class="step__title">${esc(s.title)}</h3>
        <p class="step__body">${esc(s.body)}</p>
      </li>`
      )
      .join('\n      ')}
    </ol>
  </div>
</section>`;
}

function work({ t, site, lqip }) {
  const pair = (id, n) => {
    // Both layers load unconditionally — see picture()'s `lazy` note. The card is a
    // single image's worth of bytes split in two, and half a comparison is no
    // comparison.
    const before = picture(`ba-${id}-durante`, IMG[`ba-${id}-durante`], {
      lqip,
      alt: `${t.work.beforeLabel}: o carro coberto de espuma ativa`,
      sizes: '(min-width: 40rem) 28rem, 100vw',
      lazy: false,
    });
    const after = picture(`ba-${id}-depois`, IMG[`ba-${id}-depois`], {
      lqip,
      alt: `${t.work.afterLabel}: o mesmo carro acabado, no mesmo sítio`,
      sizes: '(min-width: 40rem) 28rem, 100vw',
      lazy: false,
    });
    if (!before || !after) return null;

    return `<div data-reveal="${n}">
      <div class="ba" data-ba style="--pos:50%">
        ${before.replace('<picture', '<picture class="ba__before"')}
        ${after.replace('<picture', '<picture class="ba__after"')}
        <span class="ba__tag ba__tag--before">${esc(t.work.beforeLabel)}</span>
        <span class="ba__tag ba__tag--after">${esc(t.work.afterLabel)}</span>
        <span class="ba__handle" aria-hidden="true"><span class="ba__grip">${icon('moveHorizontal')}</span></span>
        <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="${esc(t.work.sliderLabel)}">
      </div>
      <p class="ba__hint">${icon('moveHorizontal')} ${esc(t.work.sliderLabel)}</p>
    </div>`;
  };

  const pairs = ['01'].map(pair).filter(Boolean);

  const body = pairs.length
    ? `<div class="work__grid">${pairs.join('\n')}</div>`
    : `<div class="work__grid">
      <div class="ba ba--empty" data-reveal>
        <div>
          <h3 class="ba__ph-title">${esc(t.work.placeholder.title)}</h3>
          <p class="ba__ph-body">${t.work.placeholder.body
      .replace(/src\/assets\/img\/source/g, '<code>src/assets/img/source</code>')
      .replace(/npm run images/g, '<code>npm run images</code>')}</p>
        </div>
      </div>
    </div>`;

  // The client's Reels, transcoded into silent loops. Only names with both a
  // transcode and a poster on disk get a card.
  const reels = Object.entries(t.work.reels || {})
    .filter(([name]) => reelExists(name))
    .map(
      ([name, caption], n) => `<div class="reel" data-reel data-reveal="${n}">
        <video muted loop playsinline preload="none" poster="/assets/video/${name}.webp"
          src="/assets/video/${name}.mp4" aria-label="${esc(caption)}"></video>
        <span class="reel__caption">${esc(caption)}</span>
        <span class="reel__state" data-reel-state>${icon('play')}</span>
      </div>`
    );

  return `<section class="section section--alt" id="trabalhos">
  <div class="container">
    <div class="section__head" data-reveal>
      <p class="eyebrow">${esc(t.work.eyebrow)}</p>
      <h2 class="section__title">${esc(t.work.title)}</h2>
      <p class="section__lead">${esc(t.work.lead)}</p>
    </div>
    ${body}
    ${reels.length ? `<div class="reels">${reels.join('\n')}</div>` : ''}
    <div class="work__foot" data-reveal>
      <a class="btn btn--ghost" href="${site.contact.instagram}" rel="noopener">${icon('instagram')}${esc(t.work.cta)}</a>
    </div>
  </div>
</section>`;
}

function about({ t, site, lqip }) {
  const img = picture('about-owner', IMG['about-owner'], {
    lqip,
    alt: `${site.company.owner} — ${t.about.imgAlt}`,
    sizes: '(min-width: 56rem) 50vw, 100vw',
  });

  return `<section class="section" id="sobre">
  <div class="container about">
    <div class="about__body" data-reveal>
      <p class="eyebrow">${esc(t.about.eyebrow)}</p>
      <h2 class="section__title">${esc(t.about.title)}</h2>
      <div style="margin-top:var(--s-5)">
        ${t.about.body.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
      </div>
      <blockquote class="about__quote">
        <p>“${esc(t.about.quote)}”</p>
        <footer>${esc(t.about.quoteAttrib)}</footer>
      </blockquote>
    </div>
    <figure class="about__figure${img ? '' : ' about__figure--empty'}" data-reveal>
      ${img || icon('logo', { size: 320 })}
      <figcaption class="about__owner">
        <span class="about__owner-k">${esc(t.about.ownerLabel)}</span>
        <span class="about__owner-v">${esc(site.company.owner)}</span>
      </figcaption>
    </figure>
  </div>
</section>`;
}

function faq({ t }) {
  return `<section class="section is-light">
  <div class="container">
    <div class="section__head section__head--center" data-reveal>
      <p class="eyebrow">${esc(t.faq.eyebrow)}</p>
      <h2 class="section__title">${esc(t.faq.title)}</h2>
    </div>
    <div class="faq" data-reveal>
      ${t.faq.items
      .map(
        // The answer is wrapped rather than being the <p> itself: the open/close
        // animation uses grid-template-rows 0fr→1fr, which needs a child to measure.
        (f) => `<details class="faq__item">
        <summary class="faq__q">${esc(f.q)} ${icon('chevronDown')}</summary>
        <div class="faq__a"><p>${esc(f.a)}</p></div>
      </details>`
      )
      .join('\n      ')}
    </div>
  </div>
</section>`;
}

function band({ t, site, lqip }) {
  const img = picture('band-garage', IMG['band-garage'], {
    lqip,
    alt: '',
    sizes: '100vw',
  });

  return `<section class="band">
  ${img ? `<div class="band__media">${img}</div>` : ''}
  <div class="container" data-reveal>
    <p class="eyebrow" style="justify-content:center">${esc(t.cta.eyebrow)}</p>
    <h2 class="band__title">${esc(t.cta.title)}</h2>
    <p class="band__lead">${esc(t.cta.lead)}</p>
    <div class="btn-row band__actions">
      <a class="btn btn--light btn--lg" href="${site.contact.booking}" rel="noopener">${esc(t.cta.primary)}${icon('arrowRight')}</a>
      <a class="btn btn--ghost btn--lg" href="${site.contact.instagram}" rel="noopener">${icon('instagram')}${esc(t.cta.secondary)}</a>
    </div>
  </div>
</section>`;
}

function contact({ t, site }) {
  const { contact: c } = site;
  const addr = c.address;
  const addrLine = `${addr.street}, ${addr.postalCode} ${addr.locality}`;

  return `<section class="section" id="contactos">
  <div class="container">
    <div class="section__head" data-reveal>
      <p class="eyebrow">${esc(t.contact.eyebrow)}</p>
      <h2 class="section__title">${esc(t.contact.title)}</h2>
    </div>
    <div class="contact">
      <div class="info" data-reveal>
        <div class="info__row info__row--feature">
          <span class="info__icon">${icon('truck')}</span>
          <div>
            <p class="info__k">${esc(t.contact.pickupLabel)}</p>
            <p class="info__v"><strong>${esc(t.contact.pickupValue)}</strong></p>
            <p class="info__sub">${esc(t.contact.pickupSub)}</p>
          </div>
        </div>
        <div class="info__row">
          <span class="info__icon">${icon('mapPin')}</span>
          <div>
            <p class="info__k">${esc(t.contact.addressLabel)}</p>
            <p class="info__v">${esc(addrLine)}</p>
            <p class="info__sub">${esc(addr.region)}, Portugal</p>
          </div>
        </div>
        <div class="info__row">
          <span class="info__icon">${icon('clock')}</span>
          <div>
            <p class="info__k">${esc(t.contact.hoursLabel)}</p>
            <p class="info__v">${esc(fill(t.contact.closesAt, { time: c.closesAt }))}</p>
            <p class="info__sub">${esc(t.contact.hoursUnknown)}</p>
          </div>
        </div>
        <div class="info__row">
          <span class="info__icon">${icon('calendar')}</span>
          <div>
            <p class="info__k">${esc(t.contact.bookLabel)}</p>
            <p class="info__v"><a href="${c.booking}" rel="noopener">${esc(t.contact.bookValue)}</a></p>
          </div>
        </div>
        ${c.whatsapp ? `<div class="info__row">
          <span class="info__icon">${icon('whatsapp')}</span>
          <div>
            <p class="info__k">${esc(t.contact.whatsappLabel)}</p>
            <p class="info__v"><a href="${c.whatsapp}" rel="noopener">${esc(t.contact.whatsappValue)}</a></p>
            <p class="info__sub">${esc(c.phoneDisplay)}</p>
          </div>
        </div>` : ''}
        <div class="info__row">
          <span class="info__icon">${icon('instagram')}</span>
          <div>
            <p class="info__k">${esc(t.contact.instagramLabel)}</p>
            <p class="info__v"><a href="${c.instagram}" rel="noopener">${esc(c.instagramHandle)}</a></p>
          </div>
        </div>
        ${c.facebook ? `<div class="info__row">
          <span class="info__icon">${icon('facebook')}</span>
          <div>
            <p class="info__k">${esc(t.contact.facebookLabel)}</p>
            <p class="info__v"><a href="${c.facebook}" rel="noopener">${esc(t.contact.facebookLabel)}</a></p>
          </div>
        </div>` : ''}
        <div class="info__row">
          <span class="info__icon">${icon('car')}</span>
          <div>
            <p class="info__k">${esc(t.contact.areaLabel)}</p>
            <ul class="areas">
              ${site.serviceArea.map((a) => `<li>${esc(a)}</li>`).join('\n              ')}
            </ul>
          </div>
        </div>
      </div>
      <a class="map" href="${addr.maps}" rel="noopener" data-reveal>
        <div>
          <span class="map__pin">${icon('mapPin')}</span>
          <p class="map__addr">${esc(addr.street)}<br>${esc(`${addr.postalCode} ${addr.locality}`)}</p>
          <span class="map__cta">${esc(t.contact.directions)} ${icon('arrowRight')}</span>
        </div>
      </a>
    </div>
  </div>
</section>`;
}

function footer({ t, site }) {
  const year = new Date().getFullYear();
  const links = [
    ['packs', t.nav.packs],
    ['processo', t.nav.process],
    ['trabalhos', t.nav.work],
    ['sobre', t.nav.about],
    ['contactos', t.nav.contact],
  ];

  return `<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div>
        <a class="brand" href="#top">
          ${icon('logo')}
          <span class="brand__name">${esc(site.company.name)}</span>
        </a>
        <p class="footer__tag">${esc(t.footer.tagline)} — ${esc(site.contact.address.locality)}, ${esc(site.contact.address.region)}.</p>
      </div>
      <nav aria-label="${esc(t.footer.nav)}">
        <p class="footer__h">${esc(t.footer.nav)}</p>
        <ul class="footer__list">
          ${links.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join('\n          ')}
        </ul>
      </nav>
      <div>
        <p class="footer__h">${esc(t.footer.contactHeading)}</p>
        <ul class="footer__list">
          <li><span>${esc(site.contact.address.street)}</span></li>
          <li><span>${esc(`${site.contact.address.postalCode} ${site.contact.address.locality}`)}</span></li>
          ${site.contact.whatsapp ? `<li><a href="${site.contact.whatsapp}" rel="noopener">${esc(t.contact.whatsappLabel)} — ${esc(site.contact.phoneDisplay)}</a></li>` : ''}
          <li><a href="${site.contact.instagram}" rel="noopener">${esc(site.contact.instagramHandle)}</a></li>
          ${site.contact.facebook ? `<li><a href="${site.contact.facebook}" rel="noopener">${esc(t.contact.facebookLabel)}</a></li>` : ''}
          <li><a href="${site.contact.booking}" rel="noopener">${esc(t.nav.book)} — Noona</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bar">
      <p class="footer__legal">
        <span>© ${year} ${esc(site.company.name)}. ${esc(t.footer.legal)}</span>
        <span>${esc(t.footer.credit)}</span>
      </p>
      <a class="to-top" href="#top">${esc(t.footer.backToTop)} ${icon('arrowUp')}</a>
    </div>
  </div>
</footer>

<div class="bar" data-bar>
  <a class="btn btn--ghost" href="#packs">${esc(t.bar.prices)}</a>
  <a class="btn btn--primary" href="${site.contact.booking}" rel="noopener">${esc(t.bar.book)}${icon('arrowRight')}</a>
</div>`;
}

/* ---------- page ---------- */

function render({ t, site, lqip, preloadFonts, cssHash, jsHash }) {
  const ctx = { t, site, lqip, preloadFonts, cssHash, jsHash };
  return `<!doctype html>
<html lang="${site.site.lang}">
<head>
${head(ctx)}
</head>
<body>
<a class="skip-link" href="#packs">${esc(t.skipLink)}</a>
<div class="progress" data-progress aria-hidden="true"><span></span></div>
${header(ctx)}
<main id="conteudo">
${hero(ctx)}
${packs(ctx)}
${extras(ctx)}
${process(ctx)}
${work(ctx)}
${about(ctx)}
${faq(ctx)}
${band(ctx)}
${contact(ctx)}
</main>
${footer(ctx)}
</body>
</html>`;
}

module.exports = { render };
