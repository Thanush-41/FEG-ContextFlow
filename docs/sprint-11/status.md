# Sprint 11 — Native demo casino

Status: **Acceptance complete — 2026-09-09**

## Delivered

- Native React Native casino lobby with exactly three prominent playable games,
  favourites, distinctive visual treatments and an explicit demo-only hero.
- Native game shells and replay loops for Sky Crash, Lucky Dice and Triple Pulse.
- Server-authoritative deterministic round generation with game-specific typed
  results, owner identity and idempotent play commands.
- Explicit `SIMULATION · NO CASH VALUE` disclosure on every game. Casino rounds do
  not accept stakes and never read or mutate the wallet.
- Shared contracts and API-client methods for catalogue and round play.

## Acceptance evidence

- API coverage verifies the three-game catalogue, typed crash/dice/slots results,
  idempotent retries, demo authentication and invalid-game rejection.
- Mobile coverage launches Sky Crash and renders its returned multiplier result.
- Android displayed all three native lobby cards and completed real rounds for all
  three: a 5.51× crash result, dice total 5 and a two-symbol slots match.
- iOS displayed the same three-game lobby, launched Sky Crash, rendered the no-cash
  disclosure and completed a server round with replay enabled.
- Final workspace check and both native platform builds are required immediately
  before the sprint commit.

The abandoned standalone HTML concept remains excluded.
