# Sprint 7 Status

Status: **Completed**

## Acceptance evidence

| Item | Evidence |
| --- | --- |
| S7-01 Calculations | Golden vectors cover singles, accumulators, systems, boosts, fees, tax, void legs, boundaries, and minor-unit rounding. |
| S7-02 Slip API | REST integration tests exercise creation, reads, selection mutation, mode/stake updates, four tabs, and clear with authoritative totals. |
| S7-03 Selection rules | Tests cover duplicate idempotency, same-market replacement, price acceptance, suspension, and HTTP 409 stale writes. |
| S7-04 Global state | Offer, live, and BetBuilder selections reconcile with the server and render from the same returned slip. |
| S7-05 Slip container | Compact, expanded, full-screen, keyboard, tap/drag, scrolling, and safe-area behavior were verified on iPhone and Android. |
| S7-06 Slip types | Single, Accumulator, System, and four saved tabs update their lines, odds, stake, and return from backend totals. |
| S7-07 Warnings | Odds change, suspension, incompatibility, limit, accept, removal, and two-step clear paths have recoverable UI states. |
| S7-08 QA | Shared, backend, Mongo, and mobile tests agree on totals; live Atlas and both native platforms passed. |

## End-to-end verification

- Live Atlas API flow created a price-change warning, accepted it, added a
  second event, switched to a two-line system, rejected a stale update with
  HTTP 409, and kept another numbered tab isolated and empty.
- Atlas stored one current version-4 system slip containing two selections and
  the same two-line total returned by the API.
- iPhone selected two public-offer events, kept their odds highlighted, opened
  the sheet, switched to System, showed two lines, proved tab 2 was empty, and
  restored tab 1 before opening the full-screen state.
- Android loaded the same server slip, opened the responsive sheet, scrolled to
  the totals/actions, and opened full-screen mode with the matching values.
- The debug APK and Xcode simulator app build successfully at sprint close.
