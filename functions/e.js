/**
 * Booking-click counter.
 *
 * The site's one conversion — a booking — completes on noona.pt, so nothing here can
 * observe it. What this endpoint can observe is the click that leaves for Noona, which
 * is the closest measurable proxy and the number the business actually lacks.
 *
 * It stores nothing. Each call is one request in the Pages > Functions metrics, and the
 * count over time is the answer. No cookie, no identifier, no body persisted, no IP
 * read — so there is nothing to disclose under GDPR and no consent banner earned.
 *
 * Deliberately not a third-party analytics tag: the whole site makes zero third-party
 * requests (fonts are self-hosted for the same reason), and this keeps it that way.
 *
 * If per-button numbers are ever needed rather than one total, bind a KV namespace and
 * increment by `ev` here — the label already arrives in the query string.
 */

/** 204: nothing to send back, and sendBeacon ignores the body anyway. */
const noContent = () =>
  new Response(null, {
    status: 204,
    headers: {
      // Never let a proxy answer this from cache; an uncounted click is the failure mode.
      'Cache-Control': 'no-store',
    },
  });

export const onRequestPost = () => noContent();

/* Safari has shipped builds where sendBeacon falls back to GET. Accepting it costs
   nothing and avoids silently losing that slice of clicks. */
export const onRequestGet = () => noContent();
