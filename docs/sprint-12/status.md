# Sprint 12 — Demo account, settings and sessions

Status: **Acceptance complete — 2026-09-09**

## Delivered

- Persistent profile defaults and validated preference updates.
- Device-session registration, rotation, listing and safe revocation.
- Native Profile & Settings navigation from Menu and into Demo Wallet.
- Authoritative maximum-stake rejection during ticket placement.
- Owner isolation across every new account endpoint.

## Acceptance evidence

- Full workspace check passed: typecheck, lint, 55 API tests, 5 mobile tests and
  all package builds.
- Account tests cover defaults, persistence, validation, owner isolation,
  idempotent device registration, current-session rotation and revocation.
- Ticket lifecycle tests prove the profile's maximum stake is enforced by the
  server rather than trusted to the client.
- Android debug APK built successfully; native UI navigation reached Profile &
  Settings and toggling Notifications persisted immediately through the API.
- iOS simulator build succeeded; native UI rendered all profile/privacy/limit
  controls and navigated successfully into Demo Wallet.
- API acceptance confirmed both Android and iOS device sessions.

The abandoned standalone HTML concept remains excluded.
