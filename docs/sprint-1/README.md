# Sprint 1 — Product Foundation

Sprint 1 converts the working counter prototype into an approved foundation for
the FEG ContextFlow voice-first sports experience. The existing React Native and
iOS system-surface implementation remains intact while product, UX, data,
architecture, and quality boundaries are established.

## Deliverables

- [Feature parity matrix](feature-parity-matrix.md)
- [Information architecture](information-architecture.md)
- [Core user flows](core-flows.md)
- [Architecture decision record](architecture.md)
- [MongoDB schema specification](mongodb-schema.md)
- [QA strategy](qa-strategy.md)
- [Voice-agent product contract](voice-agent-contract.md)
- [Design review](design-review.md)
- [Video reference audit](video-reference-audit.md)
- [Live status](status.md)

## Exit decision

Implementation may enter Sprint 2 after the product owner approves the
Superdesign screen direction. Architecture, domain, navigation, voice safety,
and QA decisions in this folder are the initial implementation contract and may
only change through a recorded decision.

## Protected baseline

Git tag `voice-native-skeleton-v1` points to the working counter prototype with
iOS voice capture, notifications, Home Screen widget, Live Activity, and Dynamic
Island. Product work must evolve these capabilities without deleting the
baseline until equivalent integration tests exist.
