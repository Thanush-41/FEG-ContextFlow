import { Injectable } from '@nestjs/common';
import type { OfferTimeFilter, SportsEvent } from '@feg/contracts';

type PskParticipant = { name?: string; type?: 'HOME' | 'AWAY' };
type PskFixture = {
  id?: string; sportId?: string; tournamentId?: string; name?: string; kind?: string;
  participants?: PskParticipant[]; startDatetime?: number; totalMarketCount?: number;
  features?: string[]; badges?: Array<{ shortId?: string; title?: string }>;
};
type PskOutcome = {
  id?: string; name?: string; longName?: string; odds?: number; previousOdds?: number;
  displayType?: string; features?: string[];
};
type PskMarket = { id?: string; fixtureId?: string; name?: string; outcomes?: PskOutcome[]; features?: string[] };
type PskTournament = { id?: string; sportId?: string; name?: string };
type PskSport = { id?: string; name?: string; icon?: string };
export type PskOfferPayload = {
  sports?: PskSport[]; tournaments?: PskTournament[]; fixtures?: PskFixture[];
  markets?: PskMarket[];
};

const PSK_ORIGIN = 'https://api.psk.hr';
const FOOTBALL_ID = 'ufo:sprt:00';

@Injectable()
export class PskOfferProvider {
  async load(filter: OfferTimeFilter): Promise<{ events: SportsEvent[]; sports: PskSport[] }> {
    const endpoint = filter === 'live'
      ? '/offer/structure/api/v1_0/widget/live/fixtures'
      : `/offer/structure/api/v1_0/widget/upcoming/${encodeURIComponent(FOOTBALL_ID)}/fixtures`;
    const response = await fetch(`${PSK_ORIGIN}${endpoint}`, {
      signal: AbortSignal.timeout(4_000),
      headers: { accept: 'application/json', 'user-agent': 'FEG-ContextFlow-Demo/0.1' },
    });
    if (!response.ok) throw new Error(`Offer provider returned ${response.status}.`);
    const payload = await response.json() as PskOfferPayload;
    return { events: this.map(payload, filter), sports: payload.sports ?? [] };
  }

  map(payload: PskOfferPayload, filter: OfferTimeFilter): SportsEvent[] {
    const tournaments = new Map((payload.tournaments ?? []).map(item => [item.id, item]));
    const markets = new Map<string, PskMarket[]>();
    for (const market of payload.markets ?? []) {
      if (!market.fixtureId) continue;
      markets.set(market.fixtureId, [...(markets.get(market.fixtureId) ?? []), market]);
    }
    const now = Date.now();
    const tomorrowStart = new Date(now); tomorrowStart.setHours(24, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    return (payload.fixtures ?? [])
      .filter(fixture => this.includes(fixture, filter, now, tomorrowStart.getTime(), tomorrowEnd.getTime()))
      .map(fixture => this.toEvent(fixture, tournaments.get(fixture.tournamentId), markets.get(fixture.id ?? '') ?? []))
      .filter((event): event is SportsEvent => Boolean(event))
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  }

  private includes(fixture: PskFixture, filter: OfferTimeFilter, now: number, tomorrowStart: number, tomorrowEnd: number) {
    const start = fixture.startDatetime ?? 0;
    if (filter === 'live') return fixture.kind === 'LIVE';
    if (filter === '1h') return start >= now && start <= now + 60 * 60_000;
    if (filter === '3h') return start >= now && start <= now + 3 * 60 * 60_000;
    if (filter === 'tomorrow') return start >= tomorrowStart && start < tomorrowEnd;
    if (filter === 'today') {
      const end = new Date(now); end.setHours(24, 0, 0, 0);
      return start >= now && start < end.getTime();
    }
    return true;
  }

  private toEvent(fixture: PskFixture, tournament: PskTournament | undefined, sourceMarkets: PskMarket[]): SportsEvent | null {
    if (!fixture.id || !fixture.startDatetime) return null;
    const home = fixture.participants?.find(item => item.type === 'HOME')?.name;
    const away = fixture.participants?.find(item => item.type === 'AWAY')?.name;
    if (!home || !away) return null;
    const market = sourceMarkets.find(item => (item.outcomes?.length ?? 0) >= 2);
    if (!market?.id || !market.outcomes) return null;
    const selections = market.outcomes
      .filter(item => item.id && item.odds && item.odds > 1)
      .sort((left, right) => this.selectionOrder(left.name) - this.selectionOrder(right.name))
      .slice(0, 3)
      .map(item => ({
        id: item.id!, label: item.name || item.longName || '–', odds: item.odds!,
        previousOdds: item.previousOdds && item.previousOdds > 1 ? item.previousOdds : undefined,
        state: item.displayType === 'OPEN' ? (item.previousOdds && item.previousOdds !== item.odds ? 'changed' as const : 'active' as const) : 'locked' as const,
        features: this.outcomeFeatures(item),
      }));
    if (selections.length < 2) return null;
    return {
      id: fixture.id, sportId: fixture.sportId, leagueId: fixture.tournamentId,
      sport: fixture.sportId === FOOTBALL_ID ? 'Football' : 'Sport',
      league: tournament?.name || 'Featured offer', startsAt: new Date(fixture.startDatetime).toISOString(),
      status: fixture.kind === 'LIVE' ? 'live' : 'scheduled', home, away,
      totalMarketCount: fixture.totalMarketCount ?? sourceMarkets.length,
      features: this.eventFeatures(fixture, market),
      markets: [{ id: market.id, name: market.name || 'Match result', selections, features: this.marketFeatures(market) }],
    };
  }

  private selectionOrder(name?: string) { return name === '1' ? 0 : name === 'X' ? 1 : name === '2' ? 2 : 3; }
  private eventFeatures(fixture: PskFixture, market: PskMarket): SportsEvent['features'] {
    const raw = new Set([...(fixture.features ?? []), ...(market.features ?? []), ...(fixture.badges ?? []).flatMap(item => [item.shortId ?? '', item.title ?? ''])].map(item => item.toUpperCase()));
    return [
      raw.has('BETBUILDER') && 'betBuilder', raw.has('BOOSTED_ODDS') && 'boostedOdds',
      (raw.has('STREAM') || raw.has('TV')) && 'tv', [...raw].some(item => item.includes('BONUS')) && 'bonusTip',
      raw.has('ADVANTAGE') && 'advantage',
    ].filter(Boolean) as SportsEvent['features'];
  }
  private marketFeatures(market: PskMarket): Array<'boostedOdds' | 'bonusTip'> {
    const raw = (market.features ?? []).join(' ').toUpperCase();
    return [raw.includes('BOOST') && 'boostedOdds', raw.includes('BONUS') && 'bonusTip'].filter(Boolean) as Array<'boostedOdds' | 'bonusTip'>;
  }
  private outcomeFeatures(outcome: PskOutcome): Array<'boostedOdds' | 'bonusTip'> {
    const raw = (outcome.features ?? []).join(' ').toUpperCase();
    return [raw.includes('BOOST') && 'boostedOdds', raw.includes('BONUS') && 'bonusTip'].filter(Boolean) as Array<'boostedOdds' | 'bonusTip'>;
  }
}
