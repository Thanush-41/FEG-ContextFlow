# QA Strategy

## Test pyramid

- Unit: domain rules, odds/money utilities, reducers, voice policy and parsers.
- Contract: DTO validation, OpenAPI compatibility and Socket.IO event schemas.
- Integration: NestJS modules with a MongoDB replica set and transaction tests.
- Component: React Native screens, accessibility roles and state variants.
- Native: Swift/Kotlin bridges, App Intents, widgets and lifecycle transitions.
- End to end: Maestro journeys on representative iOS and Android devices.

## Required journeys

Sign in/refresh/logout; browse-to-demo-bet; changed-price recovery; live market
suspension; ticket lookup/copy; demo wallet idempotency; deterministic game;
voice search; voice-built slip with confirmation; denied microphone permission;
background interruption; widget/Live Activity handoff; offline recovery.

## Device matrix

- iOS: current and previous major versions; small non-Island phone, standard
  Dynamic Island phone (physical iPhone 16), and large phone.
- Android: current and two previous API levels; compact and large phones;
  foreground-service and widget behavior on a physical OEM device.
- Accessibility: largest supported text, VoiceOver/TalkBack, reduced motion,
  increased contrast and keyboard/switch navigation where supported.

## Budgets and gates

| Metric | Gate |
| --- | --- |
| Cold launch to usable cached shell | p95 ≤ 2.5 s on baseline device |
| Screen transition response | p95 ≤ 250 ms excluding network |
| API cached read | p95 ≤ 300 ms locally staged |
| Socket event to visible state | p95 ≤ 500 ms |
| Voice first partial transcript | p95 ≤ 1.2 s on supported network |
| Crash-free sessions | ≥ 99.5% before release candidate |

Pull requests require lint, typecheck, unit and affected integration tests.
Release candidates additionally require native builds, critical Maestro flows,
schema migration rehearsal, accessibility smoke tests, secret scanning, and no
open Critical/High defects.
