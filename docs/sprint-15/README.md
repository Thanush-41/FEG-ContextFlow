# Sprint 15 — Demo Lotto

Sprint 15 adds a complete native Lotto journey with two open draws, one
deterministic completed result, a 1–35 number picker, quick pick and saved
owner-specific entries. All amounts and entries are demo-only and never mutate
the wallet.

## Scope

- Typed draw, result and entry contracts.
- Public draw catalogue and authenticated entry history.
- Five-unique-number validation and idempotent submission.
- MongoDB-backed persistence with an in-memory development fallback.
- Native number picker, quick pick, draw results and entry history on iOS and
  Android.

