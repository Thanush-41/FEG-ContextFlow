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

## Device-connectivity repair — 2026-09-09

- Root cause: Casino was the first screen with no bundled fallback. When a physical
  device could not reach the development API, the catalogue request error was
  discarded and the UI remained on an unexplained loading skeleton.
- The three-game catalogue is now bundled with the native app and remains usable
  while the API reconnects.
- Casino now exposes `connecting`, `service connected`, and `device demo mode`
  states with a manual retry action instead of swallowing failures.
- If the round service is unreachable, Crash, Dice, and Slots execute deterministic
  no-cash-value rounds locally. Server rounds remain the preferred path and resume
  automatically after reconnection.
- Mobile acceptance now exercises all three server-backed result shapes and the
  disconnected device-demo fallback.
