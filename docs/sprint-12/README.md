# Sprint 12 — Demo account, settings and sessions

Sprint 12 adds a persistent demo identity without pretending to provide a
production-money account. The mobile app exposes profile editing, privacy and
notification preferences, safer-play reminders, an authoritative demo stake
limit, device-session management and a direct handoff to the demo wallet.

## Scope

- Owner-isolated profile and device-session API endpoints with MongoDB and
  in-memory persistence support.
- Shared runtime-validated contracts and typed mobile client methods.
- Native Profile & Settings screen for iOS and Android.
- Editable display name, language, notification, transcript-storage, session
  reminder and maximum demo-stake preferences.
- Idempotent device registration, current-device rotation and revocation of
  non-current sessions.
- Server-side enforcement of the configured maximum demo stake at ticket
  placement time.

## Product boundary

This remains a demo-only identity backed by the existing device bearer. It is
not represented as production registration, KYC, deposit or real-money
authentication. Wallet values and stake limits use demo coins with no cash
value.

