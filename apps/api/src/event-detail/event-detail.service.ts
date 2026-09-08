import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { BetBuilderValidationInputSchema, type BetBuilderValidation, type DetailedMarket, type EventDetailResponse } from '@feg/contracts';
import { SportsService } from '../sports/sports.service.js';
import { EVENT_DETAIL_MODEL } from '../persistence/models.js';

type StoredEventDetail = EventDetailResponse & { eventId: string };

type MarketDefinition = readonly [DetailedMarket['group'], string, DetailedMarket['layout'], readonly string[]];

const marketDefinitions: Record<string, readonly MarketDefinition[]> = {
  football: [
    ['main', 'Match result', 'threeWay', ['1', 'X', '2']], ['goals', 'Total goals 2.5', 'twoWay', ['Over', 'Under']],
    ['handicap', 'Asian handicap', 'twoWay', ['Home -0.5', 'Away +0.5']], ['periods', 'First half result', 'threeWay', ['1', 'X', '2']],
    ['specials', 'Both teams to score', 'twoWay', ['Yes', 'No']], ['goals', 'Total goals 3.5', 'twoWay', ['Over', 'Under']],
    ['specials', 'Correct score', 'grid', ['1–0', '2–0', '2–1', '1–1']],
  ],
  tennis: [
    ['main', 'Match winner', 'twoWay', ['Player 1', 'Player 2']], ['goals', 'Total games 22.5', 'twoWay', ['Over', 'Under']],
    ['handicap', 'Game handicap', 'twoWay', ['Player 1 -2.5', 'Player 2 +2.5']], ['periods', 'First set winner', 'twoWay', ['Player 1', 'Player 2']],
    ['specials', 'Correct sets', 'grid', ['2–0', '2–1', '1–2', '0–2']], ['goals', 'First-set games 9.5', 'twoWay', ['Over', 'Under']],
  ],
  basketball: [
    ['main', 'Moneyline', 'twoWay', ['Home', 'Away']], ['goals', 'Total points 170.5', 'twoWay', ['Over', 'Under']],
    ['handicap', 'Point spread', 'twoWay', ['Home -4.5', 'Away +4.5']], ['periods', 'First quarter winner', 'threeWay', ['Home', 'Tie', 'Away']],
    ['specials', 'Winning margin', 'grid', ['Home 1–5', 'Home 6+', 'Away 1–5', 'Away 6+']], ['goals', 'Home points 86.5', 'twoWay', ['Over', 'Under']],
  ],
  hockey: [
    ['main', 'Match result', 'threeWay', ['1', 'X', '2']], ['goals', 'Total goals 5.5', 'twoWay', ['Over', 'Under']],
    ['handicap', 'Puck line', 'twoWay', ['Home -1.5', 'Away +1.5']], ['periods', 'First period result', 'threeWay', ['1', 'X', '2']],
    ['specials', 'Both teams score', 'twoWay', ['Yes', 'No']], ['goals', 'Home goals 2.5', 'twoWay', ['Over', 'Under']],
  ],
  generic: [
    ['main', 'Winner', 'twoWay', ['Option 1', 'Option 2']], ['goals', 'Total score', 'twoWay', ['Over', 'Under']],
    ['handicap', 'Handicap', 'twoWay', ['Option 1', 'Option 2']], ['periods', 'Opening period winner', 'twoWay', ['Option 1', 'Option 2']],
    ['specials', 'Exact outcome', 'grid', ['A', 'B', 'C', 'D']],
  ],
};

@Injectable()
export class EventDetailService {
  constructor(
    @Inject(SportsService) private readonly sports: SportsService,
    @Optional() @InjectModel(EVENT_DETAIL_MODEL) private readonly detailModel?: Model<StoredEventDetail>,
  ) {}

  async get(eventId: string): Promise<EventDetailResponse> {
    const event = await this.sports.get(eventId);
    const all = await this.sports.list();
    const marketStatus: DetailedMarket['status'] = event.status === 'finished' ? 'settled' : event.status === 'scheduled' || event.status === 'live' ? 'open' : 'suspended';
    const generated = this.markets(eventId, marketStatus, event.sport);
    const markets = event.status === 'live' && event.markets.length
      ? [this.liveMarket(event), ...generated.filter(market => market.group !== 'main')]
      : generated;
    const score = event.score?.split(/[–-]/).map(value => Number(value.trim())) ?? [];
    const homeScore = score[0];
    const awayScore = score[1];
    const hasScore = Number.isFinite(homeScore) && Number.isFinite(awayScore);
    const response: EventDetailResponse = {
      version: 1, event, markets,
      periods: hasScore ? [{ name: event.status === 'live' ? 'Current' : 'Full time', home: homeScore!, away: awayScore! }] : [],
      result: event.status === 'finished' && hasScore ? { home: homeScore!, away: awayScore!, winner: homeScore === awayScore ? 'draw' : homeScore! > awayScore! ? 'home' : 'away' } : null,
      statistics: [{ label: 'Possession', home: 54, away: 46 }, { label: 'Shots', home: 12, away: 9 }, { label: 'Corners', home: 6, away: 4 }],
      form: { home: ['W', 'W', 'D', 'L', 'W'], away: ['D', 'W', 'W', 'D', 'L'] },
      headToHead: [{ date: new Date(Date.now() - 30 * 86_400_000).toISOString(), home: event.home, away: event.away, score: '2–1' }],
      lineups: { home: this.lineup(event.home), away: this.lineup(event.away) },
      relatedEvents: all.filter(candidate => candidate.id !== event.id && candidate.sport === event.sport).slice(0, 3),
      cache: { maxAgeSeconds: event.status === 'live' ? 5 : 60, generatedAt: new Date().toISOString() },
    };
    if (this.detailModel) await this.detailModel.updateOne({ eventId }, { $set: { eventId, ...response } }, { upsert: true }).exec();
    return response;
  }

  async validate(eventId: string, candidate: unknown): Promise<BetBuilderValidation> {
    const parsed = BetBuilderValidationInputSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid BetBuilder selections.');
    const detail = await this.get(eventId);
    const outcomes = detail.markets.flatMap(market => market.outcomes.map(outcome => ({ market, outcome })));
    const selected = parsed.data.selectionIds.map(id => outcomes.find(item => item.outcome.id === id));
    if (selected.some(item => !item)) throw new NotFoundException('BetBuilder selection not found.');
    const resolved = selected.filter((item): item is NonNullable<typeof item> => Boolean(item));
    const reasons: BetBuilderValidation['reasons'] = [];
    const groups = new Map<string, string[]>();
    for (const { outcome } of resolved) groups.set(outcome.compatibilityGroup, [...(groups.get(outcome.compatibilityGroup) ?? []), outcome.id]);
    for (const ids of groups.values()) if (ids.length > 1) reasons.push({ code: 'MUTUALLY_EXCLUSIVE', message: 'Selections from the same result group cannot be combined.', selectionIds: ids });
    const suspended = resolved.filter(item => item.market.status !== 'open' || item.outcome.state === 'locked').map(item => item.outcome.id);
    if (suspended.length) reasons.push({ code: 'SELECTION_UNAVAILABLE', message: 'A selected outcome is not currently available.', selectionIds: suspended });
    const raw = resolved.reduce((total, item) => total * item.outcome.odds, 1);
    return { valid: reasons.length === 0, combinedOdds: Number((1 + (raw - 1) * 0.9).toFixed(2)), reasons };
  }

  private markets(eventId: string, status: DetailedMarket['status'], sport: string): DetailedMarket[] {
    const definitions = marketDefinitions[sport.toLowerCase()] ?? marketDefinitions.generic!;
    return definitions.map(([group, name, layout, labels], marketIndex) => ({
      id: `${eventId}-market-${marketIndex}`, group, name, layout, status,
      outcomes: labels.map((label, outcomeIndex) => {
        const odds = Number((1.55 + marketIndex * 0.17 + outcomeIndex * 0.41).toFixed(2));
        return { id: `${eventId}-outcome-${marketIndex}-${outcomeIndex}`, label, odds, state: status === 'open' ? 'active' : 'locked', features: [], compatibilityGroup: `${eventId}-group-${marketIndex}`, priceHistory: [{ odds: Number((odds + 0.08).toFixed(2)), recordedAt: new Date(Date.now() - 300_000).toISOString() }, { odds, recordedAt: new Date().toISOString() }] };
      }),
    }));
  }

  private liveMarket(event: import('@feg/contracts').SportsEvent): DetailedMarket {
    const market = event.markets[0]!;
    return {
      id: market.id, group: 'main', name: market.name,
      layout: market.selections.length === 3 ? 'threeWay' : 'twoWay', status: 'open',
      outcomes: market.selections.map(selection => ({
        id: selection.id, label: selection.label, odds: selection.odds, state: selection.state,
        features: selection.features, compatibilityGroup: `${event.id}-${market.id}`,
        priceHistory: [
          ...(selection.previousOdds ? [{ odds: selection.previousOdds, recordedAt: new Date(Date.now() - 5_000).toISOString() }] : []),
          { odds: selection.odds, recordedAt: new Date().toISOString() },
        ],
      })),
    };
  }

  private lineup(team: string) { return Array.from({ length: 11 }, (_, index) => `${team} Player ${index + 1}`); }
}
