import { Injectable, NotFoundException } from '@nestjs/common';
import type { SportsEvent } from '@feg/contracts';

const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

const events: SportsEvent[] = [
  {
    id: 'event-chelsea-liverpool', sport: 'Football', league: 'England · Premier League',
    startsAt: scheduledAt, status: 'scheduled', home: 'Chelsea', away: 'Liverpool',
    markets: [{ id: 'market-match-result-01', name: 'Match result', selections: [
      { id: 'selection-home-01', label: '1', odds: 2.25 },
      { id: 'selection-draw-01', label: 'X', odds: 3.4 },
      { id: 'selection-away-01', label: '2', odds: 2.4 },
    ] }],
  },
  {
    id: 'event-dinamo-hajduk', sport: 'Football', league: 'Croatia · HNL',
    startsAt: new Date().toISOString(), status: 'live', clock: "67'", score: '1–1',
    home: 'Dinamo Zagreb', away: 'Hajduk Split', markets: [{ id: 'market-match-result-02', name: 'Match result', selections: [
      { id: 'selection-home-02', label: '1', odds: 2.05 },
      { id: 'selection-draw-02', label: 'X', odds: 2.8 },
      { id: 'selection-away-02', label: '2', odds: 4.1 },
    ] }],
  },
];

@Injectable()
export class SportsService {
  list(status?: string) {
    return status ? events.filter(event => event.status === status) : events;
  }

  get(eventId: string) {
    const event = events.find(candidate => candidate.id === eventId);
    if (!event) throw new NotFoundException('Event not found.');
    return event;
  }
}
