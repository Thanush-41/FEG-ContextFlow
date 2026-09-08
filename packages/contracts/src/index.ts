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
  'cancelled',
]);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const SelectionSchema = z.object({
  id: PublicIdSchema,
  label: z.string().min(1),
  odds: DecimalOddsSchema,
});
export type Selection = z.infer<typeof SelectionSchema>;

export const MarketSchema = z.object({
  id: PublicIdSchema,
  name: z.string().min(1),
  selections: z.array(SelectionSchema).min(2),
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
});
export type SportsEvent = z.infer<typeof SportsEventSchema>;

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
