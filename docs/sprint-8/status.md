# Sprint 8 Status

Status: **Completed**

## Acceptance evidence

| Item | Evidence |
| --- | --- |
| S8-01 Wallet model | Wallet and ledger schemas use integer minor units, unique keys, indexed owners, and immutable-style entries. |
| S8-02 Wallet API | Owner-authenticated balance, history, deposit, and withdrawal tests verify idempotent balanced postings. |
| S8-03 Ticket placement | Placement revalidates version, warnings, price, market state, and funds inside a Mongo transaction. |
| S8-04 Ticket identifiers | Tickets store a searchable `FEG-` code, exact accepted selections, calculation, wallet delta, and audit record. |
| S8-05 Review | Native review shows selections, quick amounts, available balance, stake, return, warnings, and a gated confirm action. |
| S8-06 Receipt | Native receipt shows the backend snapshot/code/breakdown, supports copy/share, and reloads from authenticated history after restart. |
| S8-07 Demo wallet | Native wallet explicitly says Demo and No Cash Value, updates backend simulation balances, and renders ledger history without payment fields. |
| S8-08 QA | Tests cover duplicate placement, insufficient funds, stale version/odds, suspensions, owner isolation, ledger reconciliation, and transaction rollback. |

## End-to-end verification

- The full workspace check passed with 35 API tests and the React Native UI
  integration test, followed by successful TypeScript builds.
- A live Atlas flow placed a ticket, retried the identical command without a
  second debit, returned the same ticket, stored one balanced ledger posting,
  and exposed the receipt through authenticated history.
- A Mongo replica-set integration test forced ticket persistence to fail after
  debit and verified that the wallet and ledger changes were rolled back.
- Android completed review, confirmation, receipt, forced app restart, restored
  receipt, and matching Demo Wallet ledger verification against Atlas.
- The iPhone simulator rendered the Atlas-backed app, and the complete Xcode
  workspace—including the Live Activity/widget extension—built successfully.
- Android `assembleDebug` produced the refreshed debug APK successfully.
