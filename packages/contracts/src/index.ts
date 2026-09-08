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
