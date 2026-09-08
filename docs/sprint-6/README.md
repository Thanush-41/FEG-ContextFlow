# Sprint 6 — Event Detail and BetBuilder

Sprint 6 turns an offer card into a complete event workspace while preserving
the PSK-inspired compact mobile hierarchy and the existing native voice,
widget, notification, and Live Activity foundation.

## Delivered

- Versioned `GET /api/events/:eventId/detail` payloads with cache policy,
  sport-specific grouped markets, results, periods, price history, statistics,
  form, head-to-head, lineups, and related events.
- MongoDB persistence for the complete detail document. Atlas credentials stay
  runtime-only through `MONGODB_URI` and are never copied into the repository.
- Five to seven deterministic markets for football, tennis, basketball,
  hockey, and generic events, including result, totals, handicap, periods,
  specials, and football correct score.
- Server-authoritative same-event BetBuilder validation through
  `POST /api/events/:eventId/betbuilder/validate`, with combined odds and
  machine-readable incompatibility or availability reasons.
- A React Native event screen with scoreboard/status/clock, streaming state,
  favorite control, Markets/Stats/Lineups tabs, search, group chips, lazy
  accordions, two-way/three-way/grid outcomes, compatibility feedback, reset,
  and add-to-slip.
- Explicit scheduled, live, suspended, finished, postponed, and cancelled
  states with unavailable outcomes disabled accessibly.

## Runtime

The detail routes work with deterministic local fixtures and with events
normalized by the Sprint 5 public-offer adapter. With MongoDB configured, every
served detail snapshot is upserted for later retrieval and inspection.
