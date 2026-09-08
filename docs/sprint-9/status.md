# Sprint 9 — Live betting and real-time simulation

Status: **Acceptance complete — 2026-09-09**

## Delivered

- Deterministic Football, Basketball and Tennis live simulations with sport periods,
  clock, score, incidents, price movement, suspension/resume, automatic full time,
  reset and bounded incident history.
- Versioned event snapshots, replaceable event-room subscriptions, ordered envelopes,
  rate limiting and HTTP snapshot recovery.
- Administrator controls at `/api/admin/live/:eventId/control`. Production mode
  fails closed unless `DEMO_ADMIN_KEY` is configured. Identity elsewhere remains
  the existing demo identity convention, not production authentication.
- Mobile Socket.IO connection, 100ms update batching, ordered snapshot merge,
  reconnect HTTP/subscribe-ACK recovery, background disconnect and foreground
  recovery, stale-feed warning, live score/clock cards and recent incidents.
- Native sport filters and synchronized offer/detail markets preserve expanded
  markets and selected outcomes during realtime refreshes.
- Complete live bet path: live selection, changed-odds acceptance, suspended-choice
  blocking, placement revalidation, receipt, wallet, ticket and notification events.
- Metro's Zod namespace-export transform is configured explicitly, preventing the
  native runtime bundle failure found during acceptance.

## Acceptance evidence

- Full workspace `npm run check`: 43 API tests and 5 mobile tests pass, with
  typecheck, lint and TypeScript builds passing.
- Mobile hook tests exercise batched/out-of-order updates, server restart
  snapshot recovery, background disconnection and listener/timer cleanup.
- The integration suite covers price changes, acceptance, suspension, rejection,
  resume, placement, receipt lookup and wallet/ticket/notification socket output.
- 24 concurrent Socket.IO clients meet the 500 ms p95 test budget. Automatic full
  time and repeated/invalid controls are covered.
- The Android debug APK builds, installs and runs on API 34. It displayed all three
  sports, filtered Basketball to one event and added its live odd to the slip.
- The iOS simulator build, install and launch pass. Its native accessibility tree
  showed all three live sports, filtering, score/clock updates and the shared slip.
- Stopping the API changed both native apps to `Live feed reconnecting · Prices may
  be stale`; restarting restored `Live feed connected · Demo simulation`.

The standalone HTML design remains intentionally untracked and is not counted as a
native screen implementation.
