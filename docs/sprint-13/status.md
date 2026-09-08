# Sprint 13 — Promotions, content and support

Status: **Acceptance complete — 2026-09-09**

## Delivered

- Promotions list with eligibility, terms, expiry and persistent joined state.
- News and guide discovery with native article detail.
- Help centre and responsible-play sections grounded in the implemented demo
  wallet, voice privacy, stake limits and confirmation model.
- Menu navigation for all delivered discovery sections.

## Acceptance evidence

- Full workspace check passed: typecheck, lint, 57 API tests, 5 mobile tests and
  all package builds.
- API tests cover guest eligibility, authenticated opt-in, idempotency, unknown
  promotions, content filtering, article lookup and invalid requests.
- Mobile integration coverage opens Promotions, joins an offer, opens News and
  reads a complete article.
- iOS native acceptance rendered all three promotions, persisted a joined state
  and opened a news article with its complete body.
- Android native acceptance rendered all three promotions and immediately
  reflected the iOS opt-in, confirming cross-device server state.
- Android debug APK and iOS simulator app both built successfully after final
  acceptance.

The abandoned standalone HTML concept remains excluded.
