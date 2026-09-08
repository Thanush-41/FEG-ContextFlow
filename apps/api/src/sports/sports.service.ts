import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { SportsEvent } from '@feg/contracts';
import { SPORTS_EVENT_MODEL } from '../persistence/models.js';

const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

const events: SportsEvent[] = [
  {
    id: 'event-chelsea-liverpool', sport: 'Football', league: 'England · Premier League',
    startsAt: scheduledAt, status: 'scheduled', home: 'Chelsea', away: 'Liverpool',
    features: ['betBuilder'], markets: [{ id: 'market-match-result-01', name: 'Match result', features: [], selections: [
      { id: 'selection-home-01', label: '1', odds: 2.25, state: 'active', features: [] },
      { id: 'selection-draw-01', label: 'X', odds: 3.4, state: 'active', features: [] },
      { id: 'selection-away-01', label: '2', odds: 2.4, state: 'active', features: [] },
    ] }],
  },
  {
    id: 'event-dinamo-hajduk', sport: 'Football', league: 'Croatia · HNL',
    startsAt: new Date().toISOString(), status: 'live', clock: "67'", score: '1–1',
    home: 'Dinamo Zagreb', away: 'Hajduk Split', features: ['tv'], markets: [{ id: 'market-match-result-02', name: 'Match result', features: [], selections: [
      { id: 'selection-home-02', label: '1', odds: 2.05, state: 'active', features: [] },
      { id: 'selection-draw-02', label: 'X', odds: 2.8, state: 'active', features: [] },
      { id: 'selection-away-02', label: '2', odds: 4.1, state: 'active', features: [] },
    ] }],
  },
  {
    id: 'event-tennis-suspended', sport: 'Tennis', league: 'ATP Demo', startsAt: scheduledAt,
    status: 'suspended', home: 'Player Alpha', away: 'Player Beta', features: [],
    markets: [{ id: 'market-tennis-winner', name: 'Match winner', features: [], selections: [
      { id: 'selection-tennis-home', label: '1', odds: 1.72, state: 'locked', features: [] },
      { id: 'selection-tennis-away', label: '2', odds: 2.1, state: 'locked', features: [] },
    ] }],
  },
  {
    id: 'event-basketball-finished', sport: 'Basketball', league: 'Demo League', startsAt: new Date(Date.now() - 3_600_000).toISOString(),
    status: 'finished', score: '88–82', home: 'City Hoops', away: 'United Five', features: [],
    markets: [{ id: 'market-basketball-winner', name: 'Winner', features: [], selections: [
      { id: 'selection-basketball-home', label: '1', odds: 1.8, state: 'locked', features: [] },
      { id: 'selection-basketball-away', label: '2', odds: 2, state: 'locked', features: [] },
    ] }],
  },
  {
    id: 'event-hockey-postponed', sport: 'Hockey', league: 'Ice Demo', startsAt: scheduledAt,
    status: 'postponed', home: 'North Blades', away: 'South Ice', features: [],
    markets: [{ id: 'market-hockey-result', name: 'Match result', features: [], selections: [
      { id: 'selection-hockey-home', label: '1', odds: 2.2, state: 'disabled', features: [] },
      { id: 'selection-hockey-draw', label: 'X', odds: 3.4, state: 'disabled', features: [] },
      { id: 'selection-hockey-away', label: '2', odds: 2.7, state: 'disabled', features: [] },
    ] }],
  },
  {
    id: 'event-generic-cancelled', sport: 'Generic', league: 'Demo Specials', startsAt: scheduledAt,
    status: 'cancelled', home: 'Option Alpha', away: 'Option Beta', features: [],
    markets: [{ id: 'market-generic-winner', name: 'Winner', features: [], selections: [
      { id: 'selection-generic-home', label: '1', odds: 1.9, state: 'disabled', features: [] },
      { id: 'selection-generic-away', label: '2', odds: 1.9, state: 'disabled', features: [] },
    ] }],
  },
];

@Injectable()
export class SportsService {
  constructor(@Optional() @InjectModel(SPORTS_EVENT_MODEL) private readonly eventModel?: Model<SportsEvent>) {}

  async list(status?: string) {
    if (this.eventModel) {
      const query = status ? { status: status as SportsEvent['status'] } : {};
      const documents = await this.eventModel.find(query).sort({ startsAt: 1 }).lean().exec();
      if (documents.length) return documents.map(this.clean);
    }
    return status ? events.filter(event => event.status === status) : events;
  }

  async get(eventId: string) {
    const document = this.eventModel ? await this.eventModel.findOne({ id: eventId }).lean().exec() : null;
    const event = document ? this.clean(document) : events.find(candidate => candidate.id === eventId);
    if (!event) throw new NotFoundException('Event not found.');
    return event;
  }

  private clean(document: unknown): SportsEvent {
    const { _id: _discarded, ...event } = document as SportsEvent & { _id?: unknown };
    return event;
  }
}
