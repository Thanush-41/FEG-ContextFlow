import { Schema } from 'mongoose';

export const SPORTS_EVENT_MODEL = 'SportsEvent';
export const DEMO_TICKET_MODEL = 'DemoTicket';

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
