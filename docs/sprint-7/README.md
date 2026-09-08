# Sprint 7 — Bet Slip and Calculations

Sprint 7 replaces the single local selection with an authoritative,
cross-screen bet slip while preserving the compact PSK-inspired mobile design.

## Delivered

- A shared `@feg/bet-engine` library for decimal singles, accumulators, systems,
  void legs, boosts, fees, tax, and deterministic minor-unit rounding.
- Four independently persisted, versioned guest/user slip tabs with create,
  read, add/replace/remove, update, accept-price, and clear operations.
- Server-authoritative totals and recoverable warnings for odds changes,
  suspensions, incompatible selections, stake limits, and stale concurrent
  updates.
- Same-market replacement, duplicate prevention, detailed-market lookup, and
  compare-and-set version checks.
- Optimistic global odds selection followed by server reconciliation across
  offer, live, and event BetBuilder screens.
- A React Native slip container with empty and compact states, tap/drag
  expansion, full-screen mode, keyboard stake entry, Single/Accumulator/System
  controls, saved tabs, removals, warnings, and two-step clear confirmation.

## API

All routes use `/api/slips/:ownerId/tabs/:tab` where `tab` is 1–4. Selection
and update commands include `expectedVersion`; stale commands return HTTP 409
instead of overwriting a newer slip. Every successful response contains the
complete reconciled slip and its authoritative totals.
