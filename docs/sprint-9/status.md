# Sprint 9 — Live betting and real-time simulation

Status: **In progress — not acceptance-complete**

## Implemented checkpoint (2026-09-09)

- Deterministic live simulator with clock, score, incident, market suspension,
  manual price, start/pause/reset and completion commands.
- Versioned event snapshots and event-room subscriptions, subscription replacement
  and request-rate limits. Read-only HTTP snapshot endpoint: `GET /api/live/snapshots`.
- Administrator controls at `/api/admin/live/:eventId/control`. Production mode
  fails closed unless `DEMO_ADMIN_KEY` is configured. Identity elsewhere remains
  the existing demo identity convention, not production authentication.
- Mobile Socket.IO connection, 100ms update batching, ordered snapshot merge,
  reconnect HTTP/subscribe-ACK recovery, background disconnect and foreground
  recovery, stale-feed warning, live score/clock cards and recent incidents.
- Live selections are gated while disconnected. Periodic authoritative slip
  refresh displays backend price/suspension warnings; completed compact-market
  selections are now unavailable to the slip validator.
- Reset versions remain monotonic, invalid controls do not mutate state, and a
  manual price update cannot silently unlock a suspended market.

## Verified

- Full workspace `npm run check`: 39 API tests and 4 mobile tests pass, with
  typecheck, lint and TypeScript builds passing.
- Mobile hook tests exercise batched/out-of-order updates, server restart
  snapshot recovery, background disconnection and listener/timer cleanup.
- Android `assembleDebug` succeeds using OpenJDK 21 and the Homebrew Android SDK.
- iOS simulator Xcode workspace build succeeds, including existing native targets.
- Final mobile slip-refresh adjustment passed mobile typecheck, lint and all
  four mobile tests. Native debug builds do not constitute device E2E evidence.

## Remaining acceptance work — do not start Sprint 10 yet

- Sport filters and full offer/detail-market synchronization, without resetting
  market expansion or selections. Generated detail markets are still separate
  from the simulator's compact main market.
- Complete notification/wallet publication wiring; these are not complete merely
  because gateway methods/envelope types exist.
- Full-time automatic simulation stop, richer period scenarios and bounded
  incident retention; verify repeated administrative controls.
- Exercise disconnect/reconnect, background/foreground, suspension and placement
  races on both Android and iOS against the actual running backend.
- Concurrent-client load and measured socket-to-screen latency/frame-rate budgets.
- Final regression and acceptance evidence, then a sprint-completion commit.

The standalone HTML design was left unchanged and is not a native screen implementation.
