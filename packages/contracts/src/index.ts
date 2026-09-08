import { z } from 'zod';

export const PublicIdSchema = z.string().min(8).max(64);
export type PublicId = z.infer<typeof PublicIdSchema>;

export const DemoMoneySchema = z.object({
  currency: z.literal('DCO'),
  minorUnits: z.number().int().safe(),
});
export type DemoMoney = z.infer<typeof DemoMoneySchema>;

export const DecimalOddsSchema = z.number().min(1.01).max(10_000);

export const EventStatusSchema = z.enum([
  'scheduled',
  'live',
  'suspended',
  'finished',
  'postponed',
  'cancelled',
]);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const SelectionSchema = z.object({
  id: PublicIdSchema,
  label: z.string().min(1),
  odds: DecimalOddsSchema,
  previousOdds: DecimalOddsSchema.optional(),
  state: z.enum(['active', 'changed', 'locked', 'disabled']).default('active'),
  features: z.array(z.enum(['boostedOdds', 'bonusTip'])).default([]),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const MarketSchema = z.object({
  id: PublicIdSchema,
  name: z.string().min(1),
  selections: z.array(SelectionSchema).min(2),
  features: z.array(z.enum(['boostedOdds', 'bonusTip'])).default([]),
});
export type Market = z.infer<typeof MarketSchema>;

export const SportsEventSchema = z.object({
  id: PublicIdSchema,
  sport: z.string().min(1),
  league: z.string().min(1),
  startsAt: z.string().datetime(),
  status: EventStatusSchema,
  clock: z.string().optional(),
  score: z.string().optional(),
  home: z.string().min(1),
  away: z.string().min(1),
  markets: z.array(MarketSchema),
  sportId: PublicIdSchema.optional(),
  leagueId: PublicIdSchema.optional(),
  totalMarketCount: z.number().int().nonnegative().optional(),
  features: z.array(z.enum(['betBuilder', 'boostedOdds', 'tv', 'bonusTip', 'advantage'])).default([]),
});
export type SportsEvent = z.infer<typeof SportsEventSchema>;

export const OfferTimeFilterSchema = z.enum(['live', 'today', '1h', '3h', 'tomorrow', 'all']);
export type OfferTimeFilter = z.infer<typeof OfferTimeFilterSchema>;

export const OfferSportSchema = z.object({
  id: PublicIdSchema,
  name: z.string().min(1),
  icon: z.string().optional(),
  eventCount: z.number().int().nonnegative(),
});
export type OfferSport = z.infer<typeof OfferSportSchema>;

export const OfferLeagueSchema = z.object({
  id: PublicIdSchema,
  sportId: PublicIdSchema,
  name: z.string().min(1),
  pinned: z.boolean().default(false),
  events: z.array(SportsEventSchema),
});
export type OfferLeague = z.infer<typeof OfferLeagueSchema>;

export const OfferResponseSchema = z.object({
  timeFilter: OfferTimeFilterSchema,
  featured: z.array(SportsEventSchema),
  sports: z.array(OfferSportSchema),
  leagues: z.array(OfferLeagueSchema),
  cache: z.object({
    source: z.enum(['psk', 'mongodb', 'fixture']),
    generatedAt: z.string().datetime(),
    maxAgeSeconds: z.number().int().nonnegative(),
  }),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative(),
  }),
});
export type OfferResponse = z.infer<typeof OfferResponseSchema>;

export const DetailedOutcomeSchema = SelectionSchema.extend({
  compatibilityGroup: z.string().min(1),
  priceHistory: z.array(z.object({ odds: DecimalOddsSchema, recordedAt: z.string().datetime() })),
});
export type DetailedOutcome = z.infer<typeof DetailedOutcomeSchema>;

export const DetailedMarketSchema = z.object({
  id: PublicIdSchema,
  group: z.enum(['main', 'goals', 'handicap', 'periods', 'players', 'specials']),
  name: z.string().min(1),
  layout: z.enum(['twoWay', 'threeWay', 'grid']),
  status: z.enum(['open', 'suspended', 'settled']),
  outcomes: z.array(DetailedOutcomeSchema).min(2),
});
export type DetailedMarket = z.infer<typeof DetailedMarketSchema>;

export const EventDetailResponseSchema = z.object({
  version: z.literal(1),
  event: SportsEventSchema,
  markets: z.array(DetailedMarketSchema).min(5).max(20),
  periods: z.array(z.object({ name: z.string(), home: z.number().int().nonnegative(), away: z.number().int().nonnegative() })),
  result: z.object({ home: z.number().int().nonnegative(), away: z.number().int().nonnegative(), winner: z.enum(['home', 'away', 'draw']).nullable() }).nullable(),
  statistics: z.array(z.object({ label: z.string(), home: z.number(), away: z.number() })),
  form: z.object({ home: z.array(z.enum(['W', 'D', 'L'])), away: z.array(z.enum(['W', 'D', 'L'])) }),
  headToHead: z.array(z.object({ date: z.string().datetime(), home: z.string(), away: z.string(), score: z.string() })),
  lineups: z.object({ home: z.array(z.string()), away: z.array(z.string()) }),
  relatedEvents: z.array(SportsEventSchema),
  cache: z.object({ maxAgeSeconds: z.number().int().nonnegative(), generatedAt: z.string().datetime() }),
});
export type EventDetailResponse = z.infer<typeof EventDetailResponseSchema>;

export const BetBuilderValidationInputSchema = z.object({
  selectionIds: z.array(PublicIdSchema).min(1).max(12),
});
export type BetBuilderValidationInput = z.infer<typeof BetBuilderValidationInputSchema>;

export const BetBuilderValidationSchema = z.object({
  valid: z.boolean(),
  combinedOdds: z.number().min(1),
  reasons: z.array(z.object({ code: z.string(), message: z.string(), selectionIds: z.array(PublicIdSchema) })),
});
export type BetBuilderValidation = z.infer<typeof BetBuilderValidationSchema>;

export const SlipModeSchema = z.enum(['single', 'accumulator', 'system']);
export type SlipMode = z.infer<typeof SlipModeSchema>;

export const SlipSelectionSchema = z.object({
  eventId: PublicIdSchema,
  marketId: PublicIdSchema,
  selectionId: PublicIdSchema,
  eventLabel: z.string().min(1),
  marketLabel: z.string().min(1),
  selectionLabel: z.string().min(1),
  acceptedOdds: DecimalOddsSchema,
  currentOdds: DecimalOddsSchema,
  state: z.enum(['active', 'changed', 'suspended', 'void']),
  compatibilityGroup: z.string().optional(),
});
export type SlipSelection = z.infer<typeof SlipSelectionSchema>;

export const SlipWarningSchema = z.object({
  code: z.enum(['ODDS_CHANGED', 'SELECTION_SUSPENDED', 'INCOMPATIBLE_SELECTION', 'STAKE_LIMIT', 'VERSION_CONFLICT']),
  message: z.string(),
  selectionIds: z.array(PublicIdSchema).default([]),
  recoverable: z.boolean().default(true),
});
export type SlipWarning = z.infer<typeof SlipWarningSchema>;

export const SlipTotalsSchema = z.object({
  lines: z.number().int().positive(),
  totalOdds: z.number().nonnegative(),
  stakeMinorUnits: z.number().int().nonnegative(),
  grossReturnMinorUnits: z.number().int().nonnegative(),
  bonusMinorUnits: z.number().int().nonnegative(),
  feeMinorUnits: z.number().int().nonnegative(),
  taxMinorUnits: z.number().int().nonnegative(),
  potentialReturnMinorUnits: z.number().int().nonnegative(),
});
export type SlipTotals = z.infer<typeof SlipTotalsSchema>;

export const BetSlipSchema = z.object({
  id: PublicIdSchema,
  ownerId: PublicIdSchema,
  tab: z.number().int().min(1).max(4),
  version: z.number().int().nonnegative(),
  mode: SlipModeSchema,
  systemSize: z.number().int().positive().optional(),
  stake: DemoMoneySchema,
  selections: z.array(SlipSelectionSchema).max(20),
  totals: SlipTotalsSchema.nullable(),
  warnings: z.array(SlipWarningSchema),
  updatedAt: z.string().datetime(),
});
export type BetSlip = z.infer<typeof BetSlipSchema>;

export const AddSlipSelectionSchema = z.object({
  eventId: PublicIdSchema,
  marketId: PublicIdSchema,
  selectionId: PublicIdSchema,
  acceptedOdds: DecimalOddsSchema,
  expectedVersion: z.number().int().nonnegative(),
});
export type AddSlipSelection = z.infer<typeof AddSlipSelectionSchema>;

export const UpdateSlipSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  mode: SlipModeSchema.optional(),
  systemSize: z.number().int().positive().optional(),
  stakeMinorUnits: z.number().int().min(0).max(1_000_000).optional(),
  acceptOddsChanges: z.boolean().optional(),
});
export type UpdateSlip = z.infer<typeof UpdateSlipSchema>;

export const BetSelectionInputSchema = z.object({
  eventId: PublicIdSchema,
  marketId: PublicIdSchema,
  selectionId: PublicIdSchema,
  acceptedOdds: DecimalOddsSchema,
});

export const PlaceDemoBetSchema = z.object({
  selections: z.array(BetSelectionInputSchema).min(1).max(20),
  stake: DemoMoneySchema,
  idempotencyKey: z.string().uuid(),
});
export type PlaceDemoBet = z.infer<typeof PlaceDemoBetSchema>;

export const DemoTicketSchema = z.object({
  id: PublicIdSchema,
  status: z.enum(['open', 'won', 'lost', 'void']),
  placedAt: z.string().datetime(),
  selections: z.array(BetSelectionInputSchema),
  stake: DemoMoneySchema,
  potentialReturn: DemoMoneySchema,
});
export type DemoTicket = z.infer<typeof DemoTicketSchema>;

export const VoiceSessionStateSchema = z.enum([
  'idle',
  'listening',
  'thinking',
  'speaking',
  'awaiting_confirmation',
  'error',
]);
export type VoiceSessionState = z.infer<typeof VoiceSessionStateSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
