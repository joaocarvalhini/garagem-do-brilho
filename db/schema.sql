-- Booking-click log.
--
-- One row per click that leaves for Noona. Deliberately holds nothing that identifies
-- anyone: no IP, no user agent, no cookie, no session. A timestamp and which button was
-- pressed is not personal data, which is what keeps this outside GDPR consent and lets
-- the site stay banner-free.
--
-- A row per click rather than a counter per day: counters need read-modify-write, which
-- races and loses clicks, and they can only answer the question you thought of when you
-- wrote them. Rows answer questions asked later. At this volume the table stays tiny.
--
-- Apply with:
--   wrangler d1 execute garagem-stats --remote --file=db/schema.sql
-- or paste it into the D1 console in the Cloudflare dashboard.

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Unix seconds, UTC. Reporting converts to Europe/Lisbon.
  ts INTEGER NOT NULL,
  -- Event name; only "marcar" exists today, but naming it leaves room for others.
  ev TEXT NOT NULL,
  -- Which button: hero, packs, barra, rodape, comprar-voucher, ...
  de TEXT NOT NULL
);

-- Reporting is almost always "how many, over this period", optionally split by button.
CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks (ts);
CREATE INDEX IF NOT EXISTS idx_clicks_ev_ts ON clicks (ev, ts);
