# Sprint 14 — Community and shared demo tickets

Status: **Acceptance complete — 2026-09-09**

## Delivered

- Public community feed with three purposeful demo posts.
- Owner-specific reaction state and accessible reaction controls.
- Copyable shared ticket that enters the real versioned bet slip.
- Native Menu navigation and automatic return to Sport with the copied slip
  expanded for review.

## Acceptance evidence

- Full workspace check passed: typecheck, lint, 59 API tests, 5 mobile tests and
  all package builds.
- API tests cover guest feed access, authenticated reaction toggling, owner
  state and authoritative two-selection slip copying.
- Mobile integration covers feed navigation, reaction state and the complete
  copy-to-expanded-slip transition.
- iOS native acceptance reacted to Mara's post, copied the shared ticket and
  displayed both resolved selections at combined odds of 2.67.
- Android native acceptance displayed all three posts and immediately reflected
  the iOS reaction, proving cross-device server state.
- Android debug APK and iOS simulator app both built successfully after final
  acceptance.

The abandoned standalone HTML concept remains excluded.
