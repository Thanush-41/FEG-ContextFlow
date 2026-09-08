import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { CasinoPlaySchema, CompetitionTableSchema, ResultsDashboardSchema, VirtualEventSchema, VirtualResultSchema, type CompetitionTable, type VirtualEvent, type VirtualResult } from '@feg/contracts';
import { SportsService } from '../sports/sports.service.js';

@Injectable()
export class VirtualsService {
  private readonly commands = new Map<string, VirtualResult>(); private readonly history: VirtualResult[] = []; private readonly rounds = new Map<string, number>(); private readonly favorites = new Map<string, Set<string>>();
  private readonly events: VirtualEvent[] = [
    VirtualEventSchema.parse({ id: 'virtual-football-01', sport: 'football', home: 'Blue City', away: 'Red United', startsInSeconds: 45, round: 1, demoOnly: true }),
    VirtualEventSchema.parse({ id: 'virtual-basketball-01', sport: 'basketball', home: 'Metro Hoops', away: 'Coast Five', startsInSeconds: 90, round: 1, demoOnly: true }),
    VirtualEventSchema.parse({ id: 'virtual-racing-01', sport: 'racing', home: 'Rapid 7', away: 'Velocity 3', startsInSeconds: 135, round: 1, demoOnly: true }),
  ];
  constructor(@Inject(SportsService) private readonly sports: SportsService) {}
  schedule() { return this.events.map(event => ({ ...event, round: (this.rounds.get(event.id) ?? 0) + 1 })); }
  play(ownerId: string, eventId: string, candidate: unknown): VirtualResult {
    const parsed = CasinoPlaySchema.safeParse(candidate); if (!parsed.success) throw new BadRequestException('Invalid virtual play command.');
    const commandKey = `${ownerId}:${parsed.data.idempotencyKey}`; const existing = this.commands.get(commandKey); if (existing) return existing;
    const event = this.events.find(item => item.id === eventId); if (!event) throw new BadRequestException('Unknown virtual event.');
    const round = (this.rounds.get(eventId) ?? 0) + 1; this.rounds.set(eventId, round);
    const bytes = createHash('sha256').update(`${eventId}:${round}`).digest();
    const homeScore = event.sport === 'basketball' ? 70 + bytes[0]! % 31 : bytes[0]! % 5; const awayScore = event.sport === 'basketball' ? 70 + bytes[1]! % 31 : bytes[1]! % 5;
    const outcome = event.sport === 'racing' ? (homeScore <= awayScore ? `${event.home} wins` : `${event.away} wins`) : homeScore === awayScore ? 'Draw' : `${homeScore > awayScore ? event.home : event.away} wins`;
    const result = VirtualResultSchema.parse({ id: `virtual-result-${randomUUID()}`, eventId, sport: event.sport, home: event.home, away: event.away, homeScore, awayScore, outcome, round, playedAt: new Date().toISOString(), demoOnly: true });
    this.commands.set(commandKey, result); this.history.unshift(result); return result;
  }
  async results(ownerId?: string) {
    const fixtures = (await this.sports.list()).filter(event => event.status === 'finished');
    return ResultsDashboardSchema.parse({ fixtures, virtual: this.history.slice(0, 20), tables: this.tables(ownerId) });
  }
  toggleFavorite(ownerId: string, competitionId: string): CompetitionTable {
    if (!this.tables().some(table => table.id === competitionId)) throw new BadRequestException('Unknown competition.');
    const mine = this.favorites.get(ownerId) ?? new Set<string>(); mine.has(competitionId) ? mine.delete(competitionId) : mine.add(competitionId); this.favorites.set(ownerId, mine);
    return this.tables(ownerId).find(table => table.id === competitionId)!;
  }
  private tables(ownerId?: string): CompetitionTable[] {
    const favorite = this.favorites.get(ownerId ?? '');
    return [CompetitionTableSchema.parse({ id: 'competition-demo-league', name: 'Demo League', favorite: favorite?.has('competition-demo-league') ?? false, rows: [{ position: 1, team: 'City Hoops', played: 8, points: 18 }, { position: 2, team: 'United Five', played: 8, points: 15 }, { position: 3, team: 'Metro Hoops', played: 8, points: 12 }] })];
  }
}
