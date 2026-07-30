/**
 * Booking-click counter.
 *
 * The site's one conversion — a booking — completes on noona.pt, so nothing here can
 * observe it. What this endpoint can observe is the click that leaves for Noona, which
 * is the closest measurable proxy and the number the business actually lacks.
 *
 * Writes one row per click to D1 (binding `DB`), holding a timestamp and which button
 * was pressed. No IP, no user agent, no cookie, no identifier of any kind — so there is
 * nothing to disclose under GDPR and no consent banner earned. Read db/schema.sql for
 * why it is a row per click and not a counter.
 *
 * Without the binding it still answers 204, and the count is whatever the Pages
 * Functions metrics show. That is the fallback, not a broken state: the site must keep
 * working if the database is removed, mis-bound, or over quota.
 *
 * Deliberately not a third-party analytics tag: the whole site makes zero third-party
 * requests (fonts are self-hosted for the same reason), and this keeps it that way.
 */

/** 204: nothing to send back, and sendBeacon ignores the body anyway. */
const noContent = () =>
  new Response(null, {
    status: 204,
    // Never let a proxy answer this from cache; an uncounted click is the failure mode.
    headers: { 'Cache-Control': 'no-store' },
  });

/** Anyone can call this endpoint, so treat both fields as hostile before they are stored. */
const clean = (v, fallback) => {
  const s = (v || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  return s.slice(0, 40) || fallback;
};

async function record(request, env) {
  if (!env || !env.DB) return;
  const p = new URL(request.url).searchParams;
  await env.DB.prepare('INSERT INTO clicks (ts, ev, de) VALUES (?, ?, ?)')
    .bind(Math.floor(Date.now() / 1000), clean(p.get('ev'), 'marcar'), clean(p.get('de'), 'outro'))
    .run();
}

/**
 * The write is awaited inside a try, never in front of the response: sendBeacon has
 * already released the page, but a throw here would surface as a 500 in the metrics and
 * make a working site look broken.
 */
const handle = async ({ request, env }) => {
  try {
    await record(request, env);
  } catch {
    /* Counting is never worth an error. */
  }
  return noContent();
};

export const onRequestPost = handle;

/* Safari has shipped builds where sendBeacon falls back to GET. Accepting it costs
   nothing and avoids silently losing that slice of clicks. */
export const onRequestGet = handle;
