/**
 * Booking-click report: GET /stats?k=<STATS_KEY>
 *
 * Reads what functions/e.js writes. Answers three questions — how many in total, how
 * that moves day by day, and which button people actually press — because those are the
 * ones the business cannot answer today.
 *
 * Guarded by the STATS_KEY environment variable set in the Cloudflare dashboard. Click
 * volume is not a secret worth much, but it is the client's, and an unguarded URL on a
 * public domain gets indexed. With no key configured this 404s rather than opening: a
 * misconfiguration should hide the data, not publish it.
 */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      // Numbers are for whoever holds the key, not for search engines.
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

/** Same shape as any other missing path, so a wrong key reveals nothing about the right one. */
const notFound = () => new Response('Not found', { status: 404 });

export const onRequestGet = async ({ request, env }) => {
  if (!env || !env.STATS_KEY) return notFound();
  if (new URL(request.url).searchParams.get('k') !== env.STATS_KEY) return notFound();
  if (!env.DB) return json({ erro: 'Base de dados não ligada ao projeto (binding DB).' }, 503);

  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get('dias')) || 30, 1), 365);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  try {
    const [total, porDia, porOrigem, primeiro] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS n FROM clicks').first(),
      env.DB.prepare(
        "SELECT date(ts, 'unixepoch') AS dia, COUNT(*) AS n FROM clicks WHERE ts >= ? GROUP BY dia ORDER BY dia"
      )
        .bind(since)
        .all(),
      env.DB.prepare(
        'SELECT de AS origem, COUNT(*) AS n FROM clicks WHERE ts >= ? GROUP BY de ORDER BY n DESC'
      )
        .bind(since)
        .all(),
      env.DB.prepare("SELECT date(MIN(ts), 'unixepoch') AS d FROM clicks").first(),
    ]);

    const noPeriodo = (porDia.results || []).reduce((s, r) => s + r.n, 0);

    return json({
      cliquesEmMarcar: {
        desdeSempre: total?.n ?? 0,
        // The headline number is the one the period actually covers; the all-time total
        // sits beside it so a quiet week is not mistaken for a broken counter.
        nosUltimosDias: { dias: days, total: noPeriodo },
      },
      aContarDesde: primeiro?.d ?? null,
      porDia: porDia.results || [],
      porOrigem: porOrigem.results || [],
      nota: 'Cada linha é um clique num botão de marcação. Não é uma marcação confirmada — essa acontece na Noona.',
    });
  } catch (err) {
    return json({ erro: 'Consulta falhou.', detalhe: String(err && err.message) }, 500);
  }
};
