# Sprint 10 — My Bets, settlement and cash out

Status: **Acceptance complete — 2026-09-09**

## Delivered

- Authenticated, owner-isolated My Bets history with open/settled/cashed-out
  filters, lookup by ticket code and full receipt detail.
- Copy-to-slip revalidates every selection and reports skipped unavailable choices
  and changed prices instead of silently accepting them.
- Open tickets expose a deterministic 30-second demo cash-out quote followed by a
  separate confirmation. Retrying the same command cannot credit the wallet twice.
- Guarded administrator settlement supports won, lost and void outcomes. Payout,
  refund and cash-out ledger entries remain balanced and linked to the ticket.
- Resolution audit metadata, payout, status and settlement time persist with each
  ticket and publish through realtime ticket/wallet/notification channels.
- Native My Bets list, filters, lookup, detail, dynamic status/payout, current
  balance, cash-out confirmation and copy-to-slip navigation.

## Acceptance evidence

- Full automated gate: 47 API tests and 5 mobile tests plus workspace typecheck,
  lint and package builds.
- Lifecycle tests cover owner isolation, quote execution, idempotent retries,
  wallet reconciliation, history filters, copy version conflicts and won/lost/void
  settlement.
- Android completed native list → receipt → quote → confirm cash-out. The UI showed
  `CASHED OUT` and a 1.33 DCO payout; the backend wallet contained exactly one
  matching cash-out credit.
- iOS displayed the same resolved ticket and current 1000.33 DCO balance, copied its
  selection back into an expanded slip, then received a separately placed ticket's
  realtime `WON` settlement and 1.55 DCO payout in My Bets.

The standalone HTML concept remains excluded from the native implementation and
from this sprint commit.
