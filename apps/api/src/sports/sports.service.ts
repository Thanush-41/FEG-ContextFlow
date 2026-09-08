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
