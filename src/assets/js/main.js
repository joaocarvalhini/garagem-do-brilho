/**
 * Garagem do Brilho — all of the site's behaviour.
 *
 * No framework, no dependencies, one file, deferred. Every feature here is an
 * enhancement over markup that already works: with JS off you get the full page, the
 * Citadino prices, a working FAQ, and every link to the booking page. Nothing below
 * is load-bearing.
 *
 * The one rule that shapes this file: only `transform`, `opacity` and `clip-path` are
 * animated, and nothing reads layout inside a scroll or pointer handler. That is what
 * keeps it smooth on the cheap Android phone this site will mostly be read on.
 */
(() => {
  'use strict';

  // Cancel the no-JS failsafe in the document head: this file arrived, so the rules
  // that hide things before animating them are safe to keep.
  clearTimeout(window.__gbFail);

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ *
   * Formatting
   * ------------------------------------------------------------------ */

  const eur = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  /**
   * 150 -> "2h30", 480 -> "8h", 45 -> "45 min".
   * Noona states these in raw minutes, which is precise and unreadable: nobody plans
   * a day around "330 minutos".
   */
  const dur = (min) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  };

  /* ------------------------------------------------------------------ *
   * Header — frost once the hero is behind it
   * ------------------------------------------------------------------ */

  const header = q('[data-header]');
  const bar = q('[data-bar]');

  if (header) {
    // A 1px sentinel at the fold, watched by IntersectionObserver, rather than a
    // scroll listener reading scrollY on every frame.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:80vh;pointer-events:none';
    document.body.prepend(sentinel);

    new IntersectionObserver(
      ([e]) => {
        header.classList.toggle('is-stuck', !e.isIntersecting);
        // The sticky booking bar appears at the same moment, for the same reason: the
        // hero's CTA has just left the screen.
        if (bar) bar.classList.toggle('is-shown', !e.isIntersecting);
      },
      { threshold: 0 }
    ).observe(sentinel);
  }

  /* ------------------------------------------------------------------ *
   * Mobile menu
   * ------------------------------------------------------------------ */

  const menu = q('[data-menu]');
  const burger = q('[data-burger]');

  if (menu && burger) {
    const setMenu = (open) => {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      // Locking the body is what stops the page behind a full-screen panel from
      // scrolling under your finger on iOS.
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) q('a, button', menu)?.focus();
      else burger.focus();
    };

    burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    q('[data-menu-close]', menu)?.addEventListener('click', () => setMenu(false));
    qa('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

    // Escape closes it. Any panel that covers the screen needs a way out that isn't
    // hunting for the X.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */

  const reveal = () => {
    const items = qa('[data-reveal]');
    if (!items.length) return;

    if (reduced.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    /* Reveals run in both directions: an element animates in on the way down and again
     * on the way back up. Two details make that read as intentional rather than twitchy:
     *
     * 1. Hysteresis. Revealing happens 12% inside the viewport (rootMargin), but hiding
     *    happens only once the element is *completely* past an edge. Using one boundary
     *    for both would reset an element while it was still 12% on screen — the visitor
     *    would watch it blink out. Resetting is invisible; it must stay that way.
     * 2. The slide follows the scroll. Something returning from above should arrive
     *    downward, not spring up from below, so the offset is signed by the edge the
     *    element left through and stored in --reveal-y for the stylesheet to use.
     */
    const parkAbove = (el) => el.style.setProperty('--reveal-y', '-1.5rem');
    const parkBelow = (el) => el.style.setProperty('--reveal-y', '1.5rem');

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            continue;
          }
          /* Fully clear of the viewport, so re-arming cannot be seen. Measured against the
           * real viewport, never e.rootBounds: rootBounds is the root *after* rootMargin,
           * so its height here is 88% of the screen — the very boundary the hysteresis
           * exists to avoid. Using it reset elements while 20px of them were still visible. */
          const r = e.boundingClientRect;
          const vh = document.documentElement.clientHeight;
          if (r.bottom <= 0) {
            parkAbove(e.target);
            e.target.classList.remove('is-in');
          } else if (r.top >= vh) {
            parkBelow(e.target);
            e.target.classList.remove('is-in');
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );

    for (const el of items) {
      // Stagger within a group: --i is set by the template, so siblings cascade
      // instead of arriving as a slab.
      const i = Number(el.dataset.reveal) || 0;
      if (i) el.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 60}ms`);
      // Anything already above the visitor is parked upward, so that if they scroll
      // back to it, it arrives from the direction they came from. The old build revealed
      // these outright and stopped observing them; now that reveals repeat, they simply
      // take part like everything else.
      if (el.getBoundingClientRect().bottom < 0) parkAbove(el);
      io.observe(el);
    }

    // The process rules fill as they arrive — same observer pattern, different class.
    const steps = qa('[data-step]');
    if (steps.length) {
      const so = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              continue;
            }
            // Same rule as the reveals above: only re-arm out of sight.
            const r = e.boundingClientRect;
            const vh = document.documentElement.clientHeight;
            if (r.bottom <= 0 || r.top >= vh) e.target.classList.remove('is-in');
          }
        },
        { threshold: 0.4 }
      );
      steps.forEach((s) => so.observe(s));
    }
  };

  /* ------------------------------------------------------------------ *
   * Vehicle tier -> prices
   * --------------------------------------------------------------------
   * The whole pricing story of this business is "it depends on the size of the car".
   * Rather than print three tables, one control drives every price on the page.
   * ------------------------------------------------------------------ */

  const tiers = qa('[data-tier]');

  if (tiers.length) {
    const packs = qa('[data-pack]');
    const rows = qa('[data-row]');
    const live = q('[data-price-live]');
    const tierNames = {};
    tiers.forEach((t) => {
      tierNames[t.value] = t.dataset.tierName || t.value;
    });

    const paint = (el, html, animate) => {
      if (el.innerHTML === html) return;
      el.innerHTML = html;
      if (!animate || reduced.matches) return;
      el.classList.remove('is-changing');
      // Force a reflow so the animation restarts even when the class never left.
      void el.offsetWidth;
      el.classList.add('is-changing');
    };

    const apply = (tier, animate) => {
      for (const pack of packs) {
        let data;
        try {
          data = JSON.parse(pack.dataset.pack);
        } catch {
          continue;
        }
        const t = data.tiers[tier];
        if (!t) continue;

        paint(q('[data-amount]', pack), eur.format(t.price), animate);
        const d = q('[data-dur]', pack);
        if (d) d.textContent = dur(t.minutes);

        // The included steps are not identical across sizes — an SUV "Simples" is
        // aspiração, a Citadino "Simples" is limpeza do interior, and only the
        // Familiar "Detalhada" lists polimento. Showing one list for all three would
        // be a small, quotable lie.
        const list = q('[data-includes]', pack);
        if (list) {
          const items = (data.includes && data.includes[tier]) || data.includesDefault;
          list.innerHTML = items
            .map((s) => `<li>${CHECK}<span>${s}</span></li>`)
            .join('');
        }
      }

      for (const row of rows) {
        let data;
        try {
          data = JSON.parse(row.dataset.row);
        } catch {
          continue;
        }
        const t = data.tiers[tier];
        if (!t) continue;
        paint(q('[data-amount]', row), eur.format(t.price), animate);
        const d = q('[data-dur]', row);
        if (d) d.textContent = dur(t.minutes);
      }

      // Announce the change. Without this the table silently rewrites itself for a
      // screen reader user, who has no way to know the radio did anything.
      if (live && animate) live.textContent = `Preços atualizados para ${tierNames[tier]}.`;
    };

    const CHECK =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M20 6 9 17l-5-5"/></svg>';

    tiers.forEach((t) =>
      t.addEventListener('change', () => {
        if (!t.checked) return;
        apply(t.value, true);
        // One selector drives the cards today, but keep the mirror: if a second copy
        // of this control is ever added elsewhere, both stay in sync instead of
        // disagreeing about which size is picked. Harmless with a single group.
        for (const other of tiers) {
          if (other !== t && other.value === t.value) other.checked = true;
        }
      })
    );

    // Sync once on load, in case the browser restored a checked radio on refresh —
    // otherwise the markup says Citadino and the control says SUV.
    const checked = tiers.find((t) => t.checked);
    if (checked && checked.value !== 'citadino') apply(checked.value, false);
  }

  /* ------------------------------------------------------------------ *
   * Before / after
   * ------------------------------------------------------------------ */

  for (const ba of qa('[data-ba]')) {
    const range = q('.ba__range', ba);
    if (!range) continue;

    // rAF-throttled: pointer events fire faster than frames, and clip-path is cheap
    // but not free. The pending value is stored rather than dropped — discarding
    // inputs while a frame is queued loses the LAST one, so releasing mid-drag left
    // the divider a frame behind the finger.
    let raf = 0;
    let pending = null;
    const set = (v) => {
      pending = v;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        ba.style.setProperty('--pos', `${pending}%`);
        raf = 0;
      });
    };

    range.addEventListener('input', () => set(range.value));
    set(range.value);
  }

  /* ------------------------------------------------------------------ *
   * Reels
   * --------------------------------------------------------------------
   * Short silent loops of the client's own work. They play only while on screen
   * (IntersectionObserver), never under prefers-reduced-motion, and a tap toggles —
   * decorative video must stay under the visitor's thumb, not fight it.
   * ------------------------------------------------------------------ */

  const reels = qa('[data-reel]');

  if (reels.length) {
    const PLAY =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3.5 20 12 6 20.5z"/></svg>';
    const PAUSE =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';

    const setState = (reel, playing) => {
      reel.classList.toggle('is-paused', !playing);
      const badge = q('[data-reel-state]', reel);
      if (badge) badge.innerHTML = playing ? PAUSE : PLAY;
    };

    for (const reel of reels) {
      const video = q('video', reel);
      if (!video) continue;
      // A tap flips playback and pins the user's choice: once someone pauses a reel,
      // scrolling it out and back must not restart it against their will.
      reel.addEventListener('click', () => {
        if (video.paused) {
          reel.dataset.userPaused = '';
          video.play().then(() => setState(reel, true)).catch(() => {});
        } else {
          video.pause();
          reel.dataset.userPaused = '1';
          setState(reel, false);
        }
      });
      setState(reel, false);
    }

    if (!reduced.matches && 'IntersectionObserver' in window) {
      const vio = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const reel = e.target;
            const video = q('video', reel);
            if (!video) continue;
            if (e.isIntersecting && !reel.dataset.userPaused) {
              video.play().then(() => setState(reel, true)).catch(() => {});
            } else if (!e.isIntersecting && !video.paused) {
              video.pause();
              setState(reel, false);
            }
          }
        },
        { threshold: 0.5 }
      );
      reels.forEach((r) => vio.observe(r));
    }
  }

  /* ------------------------------------------------------------------ *
   * Scroll-driven motion — reading progress + hero parallax
   * --------------------------------------------------------------------
   * One listener, one rAF, one layout read per frame. Two separate scroll handlers
   * each doing their own getBoundingClientRect is how a page starts dropping frames
   * on a mid-range Android, so both effects share a frame and the hero's height is
   * measured on resize rather than on scroll.
   * ------------------------------------------------------------------ */

  const progress = q('[data-progress] span');
  const parallax = q('[data-parallax]');
  const heroInner = q('.hero__inner');

  if ((progress || parallax) && !reduced.matches) {
    let heroH = 0;
    let docScroll = 1;

    const measure = () => {
      const hero = q('.hero');
      heroH = hero ? hero.offsetHeight : 0;
      docScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    };

    let ticking = false;
    const frame = () => {
      ticking = false;
      const y = scrollY;

      if (progress) {
        progress.style.setProperty('--p', Math.min(1, Math.max(0, y / docScroll)).toFixed(4));
      }

      // Only drive the hero while it is actually on screen; past that the values are
      // meaningless and the writes are wasted.
      if (parallax && y < heroH) {
        const p = y / heroH;
        // 18% of scroll distance: enough to feel like depth, little enough that the
        // 1.06 scale on the media never exposes an edge.
        parallax.style.setProperty('--py', `${(y * 0.18).toFixed(1)}px`);
        // Clamped, and paced to reach zero at ~87% of the hero — which is after the
        // sticky booking bar has appeared (its sentinel is at 80vh). The hero's own
        // CTA must never fade out while nothing has replaced it.
        if (heroInner) {
          const o = Math.min(1, Math.max(0, 1 - p * 1.15));
          heroInner.style.setProperty('--ho', o.toFixed(3));
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };

    measure();
    frame();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => {
      measure();
      onScroll();
    });
  }

  /* ------------------------------------------------------------------ *
   * Card highlight follows the pointer
   * --------------------------------------------------------------------
   * The gradient position is a CSS variable, so the handler only writes two custom
   * properties and never touches layout. Bound on the section, not per card, and
   * skipped entirely on touch — there is no pointer to follow.
   * ------------------------------------------------------------------ */

  if (matchMedia('(hover: hover)').matches && !reduced.matches) {
    let pending = null;
    let queued = false;

    const paint = () => {
      queued = false;
      if (!pending) return;
      const { card, x, y } = pending;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    };

    document.addEventListener(
      'pointermove',
      (e) => {
        const card = e.target.closest?.('.card');
        if (!card) return;
        const r = card.getBoundingClientRect();
        pending = {
          card,
          x: (((e.clientX - r.left) / r.width) * 100).toFixed(1),
          y: (((e.clientY - r.top) / r.height) * 100).toFixed(1),
        };
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ *
   * FAQ — animated disclosure
   * --------------------------------------------------------------------
   * <details> is kept as the source of truth (it still works with JS off, and screen
   * readers get the real semantics). All this adds is the height transition, which
   * means holding the element open until the closing animation has finished.
   * ------------------------------------------------------------------ */

  for (const item of qa('.faq__item')) {
    const summary = q('.faq__q', item);
    const panel = q('.faq__a', item);
    if (!summary || !panel) continue;

    if (item.open) item.classList.add('is-open');

    summary.addEventListener('click', (e) => {
      e.preventDefault();

      if (item.open) {
        item.classList.remove('is-open');
        if (reduced.matches) {
          item.open = false;
          return;
        }
        // Wait for the panel to collapse before removing the attribute, or the
        // content vanishes instantly and there is nothing to animate.
        const done = (ev) => {
          if (ev.target !== panel) return;
          panel.removeEventListener('transitionend', done);
          item.open = false;
        };
        panel.addEventListener('transitionend', done);
      } else {
        item.open = true;
        // Next frame: the browser must paint the collapsed state once before it can
        // transition away from it.
        requestAnimationFrame(() => item.classList.add('is-open'));
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Trust strip — numbers count up
   * --------------------------------------------------------------------
   * Only the values that actually start with a number animate; "Vapor" is left
   * alone. The suffix ("h", "%") is preserved, and the final text is always the
   * original string, so nothing here can corrupt the copy.
   * ------------------------------------------------------------------ */

  const counters = qa('[data-count]').filter((el) => /^\d/.test(el.textContent.trim()));

  if (counters.length && !reduced.matches && 'IntersectionObserver' in window) {
    // The final text is read once, now, and kept off the DOM. Reading it inside the
    // observer looked equivalent and was not: an observer can deliver several records
    // for one element in a single batch (scroll fast enough and it intersects, leaves
    // and re-enters between frames), and unobserve() does not drop the records already
    // queued. The second pass then captured a half-counted "4%" as the target and the
    // strip settled on the wrong numbers. Targets cannot be re-derived from a value
    // this code is itself mutating.
    const targets = new WeakMap();
    for (const el of counters) {
      const full = el.textContent.trim();
      targets.set(el, { full, value: parseInt(full, 10), suffix: full.replace(/^\d+/, '') });
    }

    const started = new WeakSet();

    const co = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          if (started.has(el)) continue;
          started.add(el);
          co.unobserve(el);

          const { full, value, suffix } = targets.get(el);
          const t0 = performance.now();
          const DUR = 900;

          const step = (now) => {
            const p = Math.min(1, (now - t0) / DUR);
            // Expo-out, matching --ease-out: fast to almost-there, then settle.
            const eased = 1 - Math.pow(2, -10 * p);
            el.textContent = Math.round(value * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = full;
          };
          el.textContent = '0' + suffix;
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * Scrollspy
   * ------------------------------------------------------------------ */

  const links = qa('[data-spy]');

  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map();
    for (const link of links) {
      const id = link.getAttribute('href')?.slice(1);
      const section = id && document.getElementById(id);
      if (section) map.set(section, link);
    }

    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const link = map.get(e.target);
          if (!link) continue;
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        }
      },
      // A band across the upper-middle of the viewport: a section counts as "current"
      // when it occupies the part of the screen you are actually reading.
      { rootMargin: '-45% 0px -50% 0px' }
    );

    map.forEach((_, section) => spy.observe(section));
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  reveal();
})();
