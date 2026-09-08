# Sprint 6 Status

Status: **Completed**

## Acceptance evidence

| Item | Evidence |
| --- | --- |
| S6-01 Detail models | Shared contracts and Mongo schemas cover markets, outcomes, price history, results, periods, statistics, lineups, and head-to-head for five sport layouts. |
| S6-02 Market seeds | Deterministic football, tennis, basketball, hockey, and generic definitions supply 5–7 ordered markets with the required groups. |
| S6-03 Detail API | Live HTTP responses are versioned and cacheable and contain grouped markets, form, H2H, lineups, and related events. |
| S6-04 BetBuilder rules | API tests and live calls prove valid combined odds plus `MUTUALLY_EXCLUSIVE` and `SELECTION_UNAVAILABLE` reasons. |
| S6-05 Event header | React Native renders event summary, status, score/clock, favorite, streaming, stats, completed/postponed/cancelled states. |
| S6-06 Market browser | Search, category chips, lazy accordions, and responsive outcome grids are implemented and exercised on iPhone and Android. |
| S6-07 BetBuilder UI | Both platforms select compatible outcomes, receive backend odds, reset, and add only a valid builder to the slip. |
| S6-08 QA | Contract, API, Mongo, component, native builds, accessibility trees, and device journeys pass. |

## End-to-end verification

- The Atlas-backed API stored one versioned detail document with seven markets
  and two price-history points per inspected outcome.
- Live validation returned combined odds `2.50` for compatible selections and
  `MUTUALLY_EXCLUSIVE` for two outcomes from one result group.
- The iPhone simulator opened a public-offer event, toggled its favorite,
  browsed stats and both 11-player lineups, created a two-pick BetBuilder, and
  added it to the slip.
- The Android emulator opened the same event and exposed searchable markets,
  two selected outcomes, combined odds, reset, and add controls in its native
  accessibility hierarchy.
- Backend tests pass across all six event states; React Native component tests,
  Android Gradle assembly, and the Xcode simulator build pass at sprint close.
