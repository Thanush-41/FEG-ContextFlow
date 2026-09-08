# Sprint 8 — Demo Wallet, Ticket Placement, and Receipts

Sprint 8 turns a reviewed bet slip into an authoritative demo ticket with an
atomic wallet debit, balanced ledger entry, and restart-safe receipt.

## Delivered

- Integer-minor-unit demo wallets with available and bonus balances, immutable
  ledger entries, balanced postings, transaction indexes, and idempotency keys.
- Authenticated, owner-scoped balance, ledger, demo deposit, and demo withdrawal
  endpoints that never request or represent real payment details.
- MongoDB transaction-based placement that revalidates the slip version, price,
  market state, warnings, and funds before atomically debiting and creating a
  ticket.
- Searchable ticket codes, exact placement snapshots, calculation breakdowns,
  wallet before/after values, and actor/idempotency audit data.
- A PSK-density React Native review step with quick stakes, balance validation,
  backend-warning gating, explicit confirmation, and authoritative totals.
- A receipt with code, odds, stake, bonus, return, balance, copy/share actions,
  authenticated My Bets recovery, and survival across application restarts.
- An explicitly labeled Demo Wallet screen with balance, bonus, simulated
  deposit/withdraw controls, and ledger history.

## API

Wallet routes live under `/api/wallets/:userId`; ticket placement uses
`POST /api/tickets/place`; authenticated history and code lookup use
`/api/tickets/:ownerId`. The bearer demo identity must match the route or slip
owner. Duplicate idempotency keys return the original mutation or ticket.
