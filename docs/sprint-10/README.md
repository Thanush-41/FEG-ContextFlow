# Sprint 10 — My Bets, settlement and cash out

## Goal

Turn a confirmed demo receipt into a complete, auditable ticket lifecycle without
introducing real-money behavior.

## Committed scope

- Authenticated ticket history, status filters, code lookup and ticket detail.
- Copy-to-slip with explicit unavailable and repriced selection reporting.
- Short-lived deterministic demo cash-out quote and explicit confirmation.
- Idempotent `won`, `lost`, `void` and `cashed_out` resolution.
- Balanced demo-wallet payout/refund/cash-out ledger postings.
- Realtime ticket, wallet and notification updates across signed-in clients.
- Native iOS and Android My Bets list/detail/lookup/cash-out/copy surfaces.

## Boundaries

- All balances and payouts are demo coins with no cash value.
- Settlement is available only through the guarded demo-administrator endpoint.
- Cash out never occurs automatically; a quote and a second confirmation are
  required.
