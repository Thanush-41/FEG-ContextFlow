# Sprint 5 — Dense Sports Offer

Sprint 5 implements the central PSK-inspired mobile offer as a real data flow,
while keeping FEG branding and the protected native voice/widget/Live Activity
features.

## Delivered

- One paginated `GET /api/offer` composition endpoint for `live`, `today`,
  `1h`, `3h`, `tomorrow`, and `all` windows.
- A provider adapter for the public PSK offer contract observed from the live
  web application's network-loaded microfrontends.
- Normalized event, market and outcome feature metadata for BetBuilder,
  boosted odds, TV, bonus tips, advantage, changed odds and locked outcomes.
- Thirty-second in-process caching plus MongoDB persistence/fallback. Atlas is
  configured only through `MONGODB_URI`; credentials never enter source code.
- FlashList-backed mobile rendering for pages of up to 100 events, featured
  cards, collapsible/pinnable league groups, event favourites and dense odds.
- Loading, empty and upstream-fallback states with accessible controls.

## Runtime

Load `MONGODB_URI` into the API process environment and run `npm run api`.
When the public upstream cannot be reached, the endpoint serves the latest
MongoDB snapshot. Without MongoDB it remains runnable and returns a safe empty
offer, while the app retains its explicit demo fallback.

See [psk-network-contract.md](psk-network-contract.md) for the observed public
request/response boundary. It is an adapter specification, not copied source.
