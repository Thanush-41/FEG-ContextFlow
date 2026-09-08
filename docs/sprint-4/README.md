# Sprint 4 — Domain Flows

Sprint 4 makes the reference-matched shell navigable and introduces the first
working demo sports and ticket domain surface.

## Mobile

- Sport, Live, Tickets, Casino and Menu bottom-tab views.
- Event detail with main and goals markets.
- Odds selection, sticky slip and draft ticket transition.
- Scheduled and live feeds loaded through the shared API client with a
  deterministic offline fallback.
- Demo-bet submission from the ticket screen with accepted-ticket state.
- Reference-matched loading-free demo content for deterministic presentation.

## API and shared packages

- Shared Zod schemas for events, markets, selections and demo tickets.
- Scheduled/live event list and event-detail endpoints.
- Idempotent demo bet placement plus ticket list/detail endpoints.
- Typed client methods for all new endpoints.

Persistent Mongo repositories and realtime market updates follow in the next
data sprint; the API can run without Mongo for this verified in-memory slice.
