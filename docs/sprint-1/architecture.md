# ADR-001: Full-stack and Voice Foundation

- **Status:** Accepted for foundation
- **Date:** 2026-09-08

## Decision

Use a TypeScript monorepo in Sprint 2 with:

- `apps/mobile`: the existing bare React Native application, moved without a
  framework migration and retaining `ios/` and `android/` native projects.
- `apps/api`: NestJS REST API plus Socket.IO gateway.
- `packages/contracts`: shared DTO schemas, enums, IDs and event contracts.
- `packages/api-client`: generated/typed mobile transport.
- `packages/ui`: React Native design tokens and reusable primitives.
- MongoDB with Mongoose as the only database.

The sprint-plan references to Expo are superseded by bare React Native because
ActivityKit, App Intents, background audio, Dynamic Island, Android widgets, and
native release control are first-class requirements.

## Service boundaries

NestJS modules own identity, catalogue, sports, pricing, bet slip validation,
tickets, wallet, promotions, community, content, games, notifications and voice
orchestration. Modules communicate through explicit services/events, never by
reading another module's collections directly.

REST handles commands and resumable reads. Socket.IO distributes versioned
odds, scores, ticket, wallet and agent-session events. Mobile persists only safe
caches, preferences, draft slip state and opaque credentials in secure storage.

## Voice architecture

The voice layer is an orchestrator, not a privileged data path. Speech streams
to a provider adapter; the agent may call allow-listed domain tools that invoke
the same NestJS application services as REST controllers. A provider-neutral
interface permits OpenAI Realtime first and a deterministic command fallback.

Tool classes:

- Read tools execute immediately after authentication/authorization checks.
- Reversible UI tools may navigate, filter, or edit a local draft.
- Consequential demo actions return a typed preview and confirmation token.
- Placement, wallet mutation, account/security changes, or destructive actions
  require explicit user confirmation and server-side token validation.

The API key is server-side only. Native clients receive short-lived session
credentials and never contain provider secrets.

## Reliability and security

- Idempotency keys protect ticket and wallet commands.
- Optimistic UI is limited to reversible presentation state.
- WebSocket reconnect uses cursor/version recovery and REST reconciliation.
- Structured errors expose stable codes and request IDs without secrets.
- PII, tokens, raw audio and full transcripts are excluded from normal logs.
- Transcript retention defaults to off; user-visible history is opt-in.
- Local, test and production environments use separate secrets and data.

## Deployment shape

Local development uses Docker Compose with a MongoDB replica set. Cloud targets
containerized NestJS and managed MongoDB; object storage is optional for curated
content, never a second database. CI builds both native apps and the API from the
same contract revision.
