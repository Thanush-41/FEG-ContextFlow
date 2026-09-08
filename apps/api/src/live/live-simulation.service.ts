import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { LiveControlSchema, LiveEventSnapshotSchema, type LiveControl, type LiveEventSnapshot, type SportsEvent } from '@feg/contracts';

type Listener = (snapshot: LiveEventSnapshot, channels: Array<'event' | 'score' | 'market' | 'incident'>) => void;

@Injectable()
export class LiveSimulationService implements OnModuleDestroy {
  private readonly states = new Map<string, LiveEventSnapshot>();
  private readonly listeners = new Set<Listener>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly randomStates = new Map<string, number>();

  constructor() {
    for (const eventId of ['event-dinamo-hajduk', 'event-cibona-zadar', 'event-martic-vekic']) {
      this.states.set(eventId, this.initial(eventId));
      this.randomStates.set(eventId, 41);
    }
  }
  onUpdate(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  list() { return [...this.states.values()].map(state => structuredClone(state)); }
  get(eventId: string) { const state = this.states.get(eventId); return state ? structuredClone(state) : undefined; }

  control(eventId: string, candidate: unknown): LiveEventSnapshot {
    const parsed = LiveControlSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid live simulator control.');
    const control = parsed.data;
    if (!this.states.has(eventId)) throw new NotFoundException('Live simulation not found.');
    if (control.action === 'reset') { this.stopTimer(eventId); this.randomStates.set(eventId, control.seed); this.mutate(eventId, () => this.initial(eventId)); return this.emit(eventId, ['event', 'score', 'market', 'incident']); }
    if (this.states.get(eventId)?.event.status === 'finished' && control.action !== 'pause') throw new BadRequestException('Reset the completed simulation before changing it.');
    if (control.action === 'start') { this.mutate(eventId, state => ({ ...state, running: true, acceleration: control.acceleration, event: { ...state.event, status: 'live' } })); this.stopTimer(eventId); this.timers.set(eventId, setInterval(() => this.step(eventId, control.acceleration), control.intervalMs)); return this.emit(eventId, ['event']); }
    if (control.action === 'pause') { this.stopTimer(eventId); this.mutate(eventId, state => ({ ...state, running: false })); return this.emit(eventId, ['event']); }
    if (control.action === 'step') return this.step(eventId, control.seconds);
    if (control.action === 'score') return this.score(eventId, control.team);
    if (control.action === 'suspend') return this.suspend(eventId, control.marketId, control.suspended);
    if (control.action === 'price') return this.price(eventId, control.selectionId, control.odds);
    return this.complete(eventId);
  }

  private step(eventId: string, seconds: number) {
    this.mutate(eventId, state => {
      const duration = this.duration(state.event.sport);
      const clockSeconds = Math.min(duration, state.clockSeconds + seconds);
      const period = this.period(state.event.sport, clockSeconds, duration);
      const finished = clockSeconds >= duration;
      const event = { ...state.event, clock: this.clock(clockSeconds) };
      const markets = event.markets.map((market, marketIndex) => ({ ...market, selections: market.selections.map((selection, selectionIndex) => {
        if ((state.clockSeconds + marketIndex + selectionIndex) % 3 !== 0 || selection.state === 'locked') return selection;
        const direction = this.nextRandom(eventId) > 0.5 ? 1 : -1;
        const odds = Math.max(1.01, Number((selection.odds + direction * 0.05).toFixed(2)));
        return { ...selection, previousOdds: selection.odds, odds, state: 'changed' as const };
      }) }));
      const incidents = [...state.incidents];
      if (period !== state.period && !finished) incidents.push({ id: `incident-${state.sequence + 1}-period`, type: 'period' as const, clockSeconds, label: `${period} started` });
      if (finished && state.event.status !== 'finished') incidents.push({ id: `incident-${state.sequence + 1}-finished`, type: 'finished' as const, clockSeconds, label: 'Full time' });
      return { ...state, clockSeconds, period, running: finished ? false : state.running, event: { ...event, markets, status: finished ? 'finished' as const : event.status }, incidents: this.bounded(incidents) };
    });
    const snapshot = this.get(eventId)!;
    if (snapshot.event.status === 'finished') this.stopTimer(eventId);
    return this.emit(eventId, snapshot.event.status === 'finished' ? ['event', 'score', 'market', 'incident'] : ['event', 'market']);
  }

  private score(eventId: string, team: 'home' | 'away') {
    this.mutate(eventId, state => {
      const [home = 0, away = 0] = (state.event.score ?? '0–0').split(/[–-]/).map(Number);
      const score = team === 'home' ? `${home + 1}–${away}` : `${home}–${away + 1}`;
      return { ...state, event: { ...state.event, score }, incidents: this.bounded([...state.incidents, { id: `incident-${state.sequence + 1}-${team}`, type: 'goal' as const, clockSeconds: state.clockSeconds, team, label: `Score · ${team === 'home' ? state.event.home : state.event.away}` }]) };
    });
    return this.emit(eventId, ['event', 'score', 'incident']);
  }

  private suspend(eventId: string, marketId: string, suspended: boolean) {
    if (!this.get(eventId)?.event.markets.some(market => market.id === marketId)) throw new NotFoundException('Market not found.');
    let found = false;
    this.mutate(eventId, state => ({ ...state, event: { ...state.event, markets: state.event.markets.map(market => market.id !== marketId ? market : (found = true, { ...market, selections: market.selections.map(selection => ({ ...selection, state: suspended ? 'locked' as const : 'active' as const })) })) }, incidents: this.bounded([...state.incidents, { id: `incident-${state.sequence + 1}-market`, type: suspended ? 'suspension' as const : 'resume' as const, clockSeconds: state.clockSeconds, label: `${marketId} ${suspended ? 'suspended' : 'resumed'}` }]) }));
    if (!found) throw new NotFoundException('Market not found.');
    return this.emit(eventId, ['event', 'market', 'incident']);
  }

  private price(eventId: string, selectionId: string, odds: number) {
    const selection = this.get(eventId)?.event.markets.flatMap(market => market.selections).find(item => item.id === selectionId);
    if (!selection) throw new NotFoundException('Selection not found.');
    if (selection.state === 'locked') throw new BadRequestException('Resume the market before changing its price.');
    let found = false;
    this.mutate(eventId, state => ({ ...state, event: { ...state.event, markets: state.event.markets.map(market => ({ ...market, selections: market.selections.map(selection => selection.id !== selectionId ? selection : (found = true, { ...selection, previousOdds: selection.odds, odds, state: 'changed' as const })) })) } }));
    if (!found) throw new NotFoundException('Selection not found.');
    return this.emit(eventId, ['event', 'market']);
  }

  private complete(eventId: string) { this.stopTimer(eventId); this.mutate(eventId, state => ({ ...state, running: false, event: { ...state.event, status: 'finished' }, incidents: this.bounded([...state.incidents, { id: `incident-${state.sequence + 1}-finished`, type: 'finished' as const, clockSeconds: state.clockSeconds, label: 'Full time' }]) })); return this.emit(eventId, ['event', 'score', 'market', 'incident']); }
  private mutate(eventId: string, update: (state: LiveEventSnapshot) => LiveEventSnapshot) { const current = this.states.get(eventId); if (!current) throw new NotFoundException('Live simulation not found.'); this.states.set(eventId, LiveEventSnapshotSchema.parse({ ...update(current), sequence: current.sequence + 1, version: current.version + 1, emittedAt: new Date().toISOString() })); }
  private emit(eventId: string, channels: Array<'event' | 'score' | 'market' | 'incident'>) { const snapshot = this.get(eventId); if (!snapshot) throw new NotFoundException('Live simulation not found.'); for (const listener of this.listeners) listener(snapshot, channels); return snapshot; }
  private stopTimer(eventId: string) { const timer = this.timers.get(eventId); if (timer) clearInterval(timer); this.timers.delete(eventId); }
  private nextRandom(eventId: string) { const next = (1664525 * (this.randomStates.get(eventId) ?? 41) + 1013904223) >>> 0; this.randomStates.set(eventId, next); return next / 0x1_0000_0000; }
  private clock(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
  private duration(sport: string) { return sport === 'Basketball' ? 2_880 : sport === 'Tennis' ? 7_200 : 5_400; }
  private period(sport: string, clockSeconds: number, duration: number) { if (clockSeconds >= duration) return 'FT'; if (sport === 'Basketball') return `Q${Math.min(4, Math.floor(clockSeconds / 720) + 1)}`; if (sport === 'Tennis') return clockSeconds >= 3_600 ? 'SET 2' : 'SET 1'; return clockSeconds >= 2_700 ? '2H' : '1H'; }
  private bounded(incidents: LiveEventSnapshot['incidents']) { return incidents.slice(-50); }
  private initial(eventId: string): LiveEventSnapshot {
    const definitions: Record<string, { sport: string; sportId: string; leagueId: string; league: string; home: string; away: string; score: string; clockSeconds: number; odds: number[]; labels: string[] }> = {
      'event-dinamo-hajduk': { sport: 'Football', sportId: 'sport-football', leagueId: 'league-hnl-live', league: 'Croatia · HNL', home: 'Dinamo Zagreb', away: 'Hajduk Split', score: '1–1', clockSeconds: 4_020, odds: [2.05, 2.8, 4.1], labels: ['1', 'X', '2'] },
      'event-cibona-zadar': { sport: 'Basketball', sportId: 'sport-basketball', leagueId: 'league-aba-live', league: 'ABA League', home: 'Cibona', away: 'Zadar', score: '68–71', clockSeconds: 2_160, odds: [2.2, 1.68], labels: ['1', '2'] },
      'event-martic-vekic': { sport: 'Tennis', sportId: 'sport-tennis', leagueId: 'league-wta-live', league: 'WTA Croatia', home: 'Petra Martić', away: 'Donna Vekić', score: '4–3', clockSeconds: 1_800, odds: [1.92, 1.88], labels: ['1', '2'] },
    };
    const definition = definitions[eventId];
    if (!definition) throw new NotFoundException('Live simulation definition not found.');
    const suffix = eventId.split('-').slice(1).join('-');
    const legacy = eventId === 'event-dinamo-hajduk';
    const event: SportsEvent = { id: eventId, sportId: definition.sportId, leagueId: definition.leagueId, sport: definition.sport, league: definition.league, startsAt: new Date().toISOString(), status: 'live', clock: this.clock(definition.clockSeconds), score: definition.score, home: definition.home, away: definition.away, features: ['tv'], totalMarketCount: 28, markets: [{ id: legacy ? 'market-match-result-02' : `market-live-${suffix}`, name: definition.sport === 'Tennis' ? 'Match winner' : 'Match result', features: [], selections: definition.labels.map((label, index) => ({ id: legacy ? ['selection-home-02', 'selection-draw-02', 'selection-away-02'][index]! : `selection-live-${suffix}-${index}`, label, odds: definition.odds[index]!, state: 'active' as const, features: [] })) }] };
    return LiveEventSnapshotSchema.parse({ eventId, version: 1, sequence: 0, clockSeconds: definition.clockSeconds, period: this.period(definition.sport, definition.clockSeconds, this.duration(definition.sport)), acceleration: 15, running: false, event, incidents: [{ id: `incident-${suffix}-kickoff`, type: 'kickoff', clockSeconds: 0, label: definition.sport === 'Tennis' ? 'Match started' : 'Kick-off' }], emittedAt: new Date().toISOString() });
  }
  onModuleDestroy() { for (const eventId of this.timers.keys()) this.stopTimer(eventId); }
}
