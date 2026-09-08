import { Schema } from 'mongoose';

export const SPORTS_EVENT_MODEL = 'SportsEvent';
export const DEMO_TICKET_MODEL = 'DemoTicket';
export const EVENT_DETAIL_MODEL = 'EventDetail';

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
