import { Schema } from 'mongoose';

export const SPORTS_EVENT_MODEL = 'SportsEvent';
export const DEMO_TICKET_MODEL = 'DemoTicket';
export const EVENT_DETAIL_MODEL = 'EventDetail';
export const BET_SLIP_MODEL = 'BetSlip';
export const WALLET_MODEL = 'Wallet';
export const LEDGER_ENTRY_MODEL = 'LedgerEntry';
export const DEMO_PROFILE_MODEL = 'DemoProfile';
export const DEMO_SESSION_MODEL = 'DemoSession';

const selectionSchema = new Schema(
  { id: { type: String, required: true }, label: { type: String, required: true }, odds: { type: Number, required: true }, previousOdds: Number, state: String, features: [String] },
  { _id: false },
);

const marketSchema = new Schema(
  { id: { type: String, required: true }, name: { type: String, required: true }, selections: { type: [selectionSchema], required: true }, features: [String] },
  { _id: false },
);

export const sportsEventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sport: { type: String, required: true }, league: { type: String, required: true },
    startsAt: { type: String, required: true }, status: { type: String, required: true, index: true },
    clock: String, score: String, home: { type: String, required: true }, away: { type: String, required: true },
    markets: { type: [marketSchema], required: true },
    sportId: String, leagueId: String, totalMarketCount: Number, features: [String],
  },
  { versionKey: false },
);

const betSelectionSchema = new Schema(
  { eventId: String, marketId: String, selectionId: String, acceptedOdds: Number },
  { _id: false },
);

export const demoTicketSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    status: { type: String, required: true }, placedAt: { type: String, required: true },
    selections: { type: [betSelectionSchema], required: true },
    stake: { currency: String, minorUnits: Number },
    potentialReturn: { currency: String, minorUnits: Number },
    code: { type: String, unique: true, sparse: true, index: true }, calculation: Schema.Types.Mixed,
    walletBeforeMinorUnits: Number, walletAfterMinorUnits: Number,
    placementSnapshot: [Schema.Types.Mixed], audit: Schema.Types.Mixed,
    settledAt: String, payout: Schema.Types.Mixed, resolution: String, resolutionAudit: Schema.Types.Mixed,
  },
  { versionKey: false },
);

export const priceHistorySchema = new Schema({ odds: Number, recordedAt: String }, { _id: false });
export const detailedOutcomeSchema = new Schema({
  id: String, label: String, odds: Number, previousOdds: Number, state: String,
  features: [String], compatibilityGroup: String, priceHistory: [priceHistorySchema],
}, { _id: false });
export const detailedMarketSchema = new Schema({
  id: String, group: String, name: String, layout: String, status: String,
  outcomes: [detailedOutcomeSchema],
}, { _id: false });
export const eventStatisticSchema = new Schema({ label: String, home: Number, away: Number }, { _id: false });
export const eventPeriodSchema = new Schema({ name: String, home: Number, away: Number }, { _id: false });
export const eventResultSchema = new Schema({ home: Number, away: Number, winner: String }, { _id: false });
export const headToHeadSchema = new Schema({ date: String, home: String, away: String, score: String }, { _id: false });
export const lineupSchema = new Schema({ home: [String], away: [String] }, { _id: false });

export const eventDetailSchema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  version: Number, event: Schema.Types.Mixed, markets: [detailedMarketSchema],
  periods: [eventPeriodSchema], result: eventResultSchema,
  statistics: [eventStatisticSchema], form: Schema.Types.Mixed,
  headToHead: [headToHeadSchema], lineups: lineupSchema,
  relatedEvents: [Schema.Types.Mixed], cache: Schema.Types.Mixed,
}, { versionKey: false });

const slipSelectionSchema = new Schema({
  eventId: String, marketId: String, selectionId: String, eventLabel: String,
  marketLabel: String, selectionLabel: String, acceptedOdds: Number,
  currentOdds: Number, state: String, compatibilityGroup: String,
}, { _id: false });
const slipWarningSchema = new Schema({ code: String, message: String, selectionIds: [String], recoverable: Boolean }, { _id: false });
export const betSlipSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  id: { type: String, required: true, unique: true, index: true }, ownerId: { type: String, required: true, index: true },
  tab: Number, version: Number, mode: String, systemSize: Number,
  stake: Schema.Types.Mixed, selections: [slipSelectionSchema], totals: Schema.Types.Mixed,
  warnings: [slipWarningSchema], updatedAt: String,
}, { versionKey: false });

export const walletSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true }, currency: { type: String, required: true },
  availableMinorUnits: { type: Number, required: true }, bonusMinorUnits: { type: Number, required: true }, updatedAt: { type: String, required: true },
}, { versionKey: false });

const postingSchema = new Schema({ account: String, amountMinorUnits: Number }, { _id: false });
export const ledgerEntrySchema = new Schema({
  id: { type: String, required: true, unique: true, index: true }, userId: { type: String, required: true, index: true },
  type: String, amountMinorUnits: Number, currency: String, balanceAfterMinorUnits: Number,
  idempotencyKey: { type: String, required: true, unique: true, index: true }, ticketId: String,
  postings: [postingSchema], createdAt: { type: String, required: true, index: true },
}, { versionKey: false, timestamps: false });

export const demoProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true }, displayName: String,
  locale: String, oddsFormat: String, theme: String, notificationsEnabled: Boolean,
  transcriptStorageEnabled: Boolean, sessionReminderMinutes: Number,
  maxDemoStakeMinorUnits: Number, createdAt: String, updatedAt: String,
}, { versionKey: false });

export const demoSessionSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true }, userId: { type: String, required: true, index: true },
  deviceName: String, current: Boolean, createdAt: String, lastSeenAt: String, revokedAt: String,
}, { versionKey: false });
