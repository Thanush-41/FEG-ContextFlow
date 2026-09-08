# MongoDB Schema Specification

Every mutable document contains `createdAt`, `updatedAt`, `version`, and where
applicable `createdBy`, `updatedBy`, and soft-deletion metadata. Public IDs are
opaque UUID/ULID strings; MongoDB `_id` values do not cross API boundaries.

| Collection | Core fields | Important indexes |
| --- | --- | --- |
| `users` | publicId, email/phone hash, displayName, status, roles | unique publicId; sparse unique identity hashes |
| `credentials` | userId, passwordHash, provider, failedAttempts | unique user/provider; never returned |
| `sessions` | userId, refreshTokenHash, device, expiresAt, revokedAt | userId; TTL expiresAt |
| `preferences` | userId, theme, locale, oddsFormat, voice, notifications | unique userId |
| `wallets` | userId, demoCurrency, available, reserved, version | unique userId |
| `walletTransactions` | walletId, type, amount, balanceAfter, idempotencyKey, reference | unique wallet/idempotencyKey; wallet/date |
| `sports` | publicId, slug, name, order, enabled | unique slug; order |
| `competitions` | sportId, country, slug, name, enabled | sportId/order; unique sportId/slug |
| `participants` | sportId, type, name, aliases | sportId/name; aliases |
| `events` | competitionId, participants, startsAt, status, score, version | status/startsAt; competitionId/startsAt |
| `markets` | eventId, type, name, status, specifier, version | eventId/status; unique eventId/type/specifier |
| `selections` | marketId, name, outcomeKey, decimalOdds, status, version | marketId/status; unique marketId/outcomeKey |
| `betSlips` | owner/session, selections snapshot, stake, status, expiresAt | owner/updatedAt; TTL abandoned expiresAt |
| `tickets` | userId, publicId, legs, stake, potentialReturn, status, placedAt | userId/status/date; unique publicId |
| `ticketEvents` | ticketId, sequence, type, payload, occurredAt | unique ticketId/sequence |
| `promotions` | publicId, eligibility, content, startsAt, endsAt | active time window; unique publicId |
| `promotionClaims` | promotionId, userId, state | unique promotionId/userId |
| `favorites` | userId, entityType, entityId | unique userId/entityType/entityId |
| `communityPosts` | authorId, ticketId, body, visibility, counters | visibility/date; authorId/date |
| `games` | publicId, category, name, seedConfig, enabled | category/order; unique publicId |
| `gameSessions` | userId, gameId, seed, state, expiresAt | userId/date; TTL expiresAt |
| `lottoDraws` | publicId, closesAt, drawnAt, status, seed, result | status/closesAt; unique publicId |
| `articles` | publicId, slug, type, title, body, publishedAt | unique slug; type/publishedAt |
| `notifications` | userId, type, payload, readAt, expiresAt | userId/readAt/date; TTL expiresAt |
| `voiceSessions` | publicId, userId/deviceId, status, locale, expiresAt | userId/date; TTL expiresAt |
| `voiceTurns` | sessionId, sequence, transcriptRedacted, intent, toolCalls, outcome | unique sessionId/sequence; TTL createdAt |
| `outboxEvents` | aggregate, aggregateId, sequence, type, payload, publishedAt | unpublished/date; unique aggregate/id/sequence |
| `auditEvents` | actor, action, subject, requestId, safeDiff, occurredAt | subject/date; actor/date; TTL per policy |

## Transaction boundaries

- Ticket placement: validate versions, debit demo wallet, create ticket and
  outbox event in one replica-set transaction.
- Settlement: transition ticket, credit demo wallet and append timeline/outbox
  records atomically.
- Demo deposit/withdraw: wallet mutation plus immutable ledger entry.
- Promotion award: claim transition plus wallet transaction.

High-volume odds and score updates use versioned atomic writes rather than
multi-document transactions. Seed scripts use stable identifiers and upserts.
