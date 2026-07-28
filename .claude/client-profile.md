# Client Profile — Garagem do Brilho

Canonical business context for this repository. Required before any copy, SEO, or conversion work
per `agents/business-analyst.md`. Load it instead of re-deriving from content files.

**Last verified:** 2026-07-27
**Sources:** `src/content/site.json`, `src/content/pt.json`, `README.md`. Upstream facts originate
from the client's Noona booking page and their shared Google Photos album, July 2026.
**Review trigger:** quarterly per `workflows/maintenance.md`, or whenever Noona pricing changes.

Nothing in this file is invented. Facts are marked **Confirmed** (published by the client),
**Derived** (computed from confirmed data), or **Unknown** (never assume — ask).

---

## Business

| Field | Value | Status |
|---|---|---|
| Trading name | Garagem do Brilho | Confirmed |
| Tagline | Especialistas em Limpeza de Detalhe Automóvel | Confirmed |
| Industry | Automotive detailing — hand car cleaning, not a wash tunnel | Confirmed |
| Owner / operator | Daniel Cadete | Confirmed |
| Base | R. Sociedade Recreativa 1 Maio 205, 2430-177 Marinha Grande, Leiria | Confirmed |
| Legal name, NIF | — | Unknown |
| Years trading | — | Unknown |
| Team size | Copy implies a single operator ("uma garagem", "quem trata do seu carro") | Unknown |

Positioning, in the client's own words: *"Devolvemos o aspeto de novo ao seu carro"*, *"Atenção ao
pormenor"*, *"Qualidade Premium"*, *"Spa Day"*. The stated contrast is against speed —
*"Não é uma lavagem rápida"*, *"sem pressa, e sem atalhos"*. Time spent is the product.

## Service area

Marinha Grande (base), Leiria, Vieira de Leiria, São Pedro de Moel, Monte Real, Pataias, Nazaré.
**Confirmed** as published. Pickup and delivery are included site-wide, which effectively makes the
radius a cost question rather than a coverage one — **Unknown** whether there is a distance limit
or a surcharge beyond a certain range.

## Services and yield

Four packs across three vehicle tiers, plus four add-ons and one voucher. Prices are VAT-inclusive
and mirrored from Noona.

**Derived — revenue per bay-hour** (price ÷ duration). Costs are **Unknown**, so this is yield,
not margin. It is still the sharpest commercial signal available in the repo.

| Offer | Citadino | Familiar | SUV & XL |
|---|---|---|---|
| Simples | 10.00 €/h | 10.00 €/h | 8.75 €/h |
| Completa Têxteis *(featured)* | 12.00 €/h | 12.73 €/h | 13.33 €/h |
| Completa Peles | 13.00 €/h | 13.64 €/h | 15.00 €/h |
| Detalhada | 16.25 €/h | 18.75 €/h | **25.00 €/h** |

| Add-on | Duration | Price | Yield |
|---|---|---|---|
| Estofos | 120 min | 50–70 € | **25.00–35.00 €/h** |
| Motor | 60 min | 20 € | 20.00 €/h |
| Exterior | 60 min | 15–20 € | 15.00–20.00 €/h |
| Interior | 75 min | 15–25 € | 12.00–20.00 €/h |
| Voucher (4 × Simples) | 600 min | 75 € | **7.50 €/h** |

Three findings the client should see:

1. **Add-ons out-yield most packs.** Estofos alone returns two to three times a Simples per hour of
   bay time. They are currently presented last, after the voucher.
2. **Detalhada SUV is the best hour in the business** at 25 €/h — nearly three times a Simples SUV.
   It is not the featured pack.
3. **The voucher is the lowest-yield offer on the menu** at 7.50 €/h, and it discounts the pack that
   already yields least. It buys repeat custom; whether that trade is worth it depends on cost and
   occupancy data the repo does not hold. Worth asking before promoting it further.

Ranking by demand is **Unknown** — "Mais escolhido" on Completa Têxteis is a marketing label in
`site.json`, not measured data. Ask Noona for actual booking counts per pack.

## Customer

- **Target, inferred from the offer and copy:** owners of cars they care about, in and around
  Marinha Grande, willing to give the car up for 2.5–8 hours and to pay several times a tunnel-wash
  price. The vehicle tiers name premium marques as examples (BMW, Audi, Mercedes, Porsche, Volvo).
- **Ideal customer, stated by the client:** **Unknown** — ask.
- **Customer they want less of:** **Unknown** — ask. The yield table suggests low-tier Simples and
  voucher work is the candidate.
- **Decision path:** comparison-led, not urgent. The FAQ answers sizing, pack differences, duration
  and booking — all pre-purchase research questions, not emergency ones.

## Enquiries and conversion

| Channel | Status |
|---|---|
| Noona online booking (primary) | Confirmed — real-time availability, off-site |
| WhatsApp `+351 960 139 151` | Confirmed |
| Phone `+351 960 139 151` | Confirmed |
| Instagram `@garagemdobrilho_pt` | Confirmed — the client's own work feed |
| Facebook | Confirmed |
| Email | **Unknown** — `null` in `site.json` |

**Primary conversion:** completed booking on Noona.
**Secondary:** WhatsApp message; Instagram follow.

**Measurement gap.** Booking happens on a third-party domain, so the site cannot observe its own
primary conversion. Nothing currently ties a visit to a booking. Until Noona exposes source data or
an outbound-click event is recorded, any claim about what the site produces is unverifiable.
This is the single biggest hole in the profile.

Which channel converts best is **Unknown**.

## Trust assets

**Held:** real photography and video of the client's own work (BMW Série 4 before/after, Porsche
Macan, foam, wheels); a photograph of Daniel himself in the About section; named owner; itemised
inclusions per pack; published prices; real-time public availability; pickup and delivery included.

**Missing:** no reviews or testimonials anywhere in the repo — not on Noona, not quoted on the
site. No years-trading figure, no job count, no certifications, no insurance statement.

Two highest-return gaps, in order:

1. **Reviews.** Detailing is bought on trust and there is currently zero third-party proof.
   A review request at handover, pointed at Google or Noona, is the cheapest lever available.
2. **Concrete numbers.** Years trading, cars treated, or any verifiable figure. The site currently
   argues entirely from craft and photography, with nothing countable to anchor it. Owner-operator
   visibility is already covered — Daniel's photograph is in place.

## Brand

Official Inkscape vector in `src/assets/brand/` (Rubik italic wordmark plus car/droplet/sparkle
mark), with black, white, and original variants. Cyan `#059FD0` accent on deep navy surfaces,
ramp 300–700 validated to WCAG AA. Typeface Rubik. All **Confirmed**.

## Differentiators

Stated and supportable from the repo:

- Pickup and delivery included, not charged as an extra
- Individual treatment, explicitly not a tunnel or a chain
- Named, itemised inclusions that differ honestly by vehicle tier
- Real-time public booking calendar
- Detail focus called out concretely — window channels, trim, inside of wheels, seat stitching

## Seasonality and capacity

**Unknown.** No demand data in the repo. Capacity is structurally tight and worth noting: a single
Detalhada consumes a full 8-hour day, so the calendar can hold at most one per day. Whether that
constrains revenue is **Unknown** without occupancy data.

## Open questions for the client

Batch these into one conversation, highest value first.

1. Do you have any reviews anywhere, and can we set up a request at handover?
2. Can we get a photograph of you working? It is the biggest missing conversion asset.
3. Which packs actually sell, from the Noona booking history?
4. What does an hour in the garage cost you to run — so yield can become margin?
5. Full weekly opening hours. The site can only say "aberto até às 19:00".
6. Is `garagemdobrilho.pt` registered and yours? It is assumed throughout the build.
7. NIF and GPS coordinates, to complete the `LocalBusiness` structured data.
8. Is there a distance limit or surcharge on pickup and delivery?
9. Which jobs do you want more of, and which would you rather turn down?
10. Do you want a public email address, or is booking plus WhatsApp deliberate?

## Divergence

None outstanding. `README.md`'s gaps list was corrected on 2026-07-27 — it had still shown the
phone/WhatsApp and Daniel's photograph as missing after both had been supplied. It now mirrors the
four warnings the build actually emits.

**Standing rule:** the build's `audit()` in `scripts/build.js` is the authority on what is missing.
Run `npm run build` and read the warnings before trusting any prose list, here or in the README.
