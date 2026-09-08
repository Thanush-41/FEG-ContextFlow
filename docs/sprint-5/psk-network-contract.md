# Observed PSK Offer Network Contract

Observed on 2026-09-08 from the public `psk.hr` mobile web application and its
loaded `offer-application` manifest.

## Gateway and reads used

- Gateway: `https://api.psk.hr/offer`
- Sports catalogue: `/structure/api/v1_0/sports`
- Live aggregate: `/structure/api/v1_0/widget/live/fixtures`
- Upcoming sports: `/structure/api/v1_0/widget/upcoming/sports`
- Upcoming football aggregate:
  `/structure/api/v1_0/widget/upcoming/{sportId}/fixtures`
- Fixture detail: `/structure/api/v1_0/fixture/{fixtureId}`
- Fixture markets: `/markets/api/v1_0/fixture/{fixtureId}/markets`

The aggregate response contains `sports`, `tournaments`, `fixtures`, and
`markets`. Fixtures reference a tournament and ordered HOME/AWAY participants;
markets reference fixtures and contain outcomes with current/previous decimal
odds and display state. Feature arrays and badges expose capabilities such as
`BETBUILDER`, `ADVANTAGE`, statistics, streaming and promotional metadata.

## Adapter boundary

Only public, unauthenticated read endpoints are consumed. The app never calls
PSK directly and no PSK account, betslip, wallet, placement, or player endpoint
is used. FEG maps the public read model into its own shared contracts and demo-
only ticket workflow. A short timeout, MongoDB snapshot and local fixture keep
the native experience deterministic when upstream data changes or is offline.
