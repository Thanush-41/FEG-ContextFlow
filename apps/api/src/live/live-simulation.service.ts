import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { LiveControlSchema, LiveEventSnapshotSchema, type LiveControl, type LiveEventSnapshot, type SportsEvent } from '@feg/contracts';

type Listener = (snapshot: LiveEventSnapshot, channels: Array<'event' | 'score' | 'market' | 'incident'>) => void;

@Injectable()
export class LiveSimulationService implements OnModuleDestroy {
  private readonly states = new Map<string, LiveEventSnapshot>();
  private readonly listeners = new Set<Listener>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private randomState = 41;

  constructor() { this.states.set('event-dinamo-hajduk', this.initial()); }
  onUpdate(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  list() { return [...this.states.values()].map(state => structuredClone(state)); }
  get(eventId: string) { const state = this.states.get(eventId); return state ? structuredClone(state) : undefined; }

  control(eventId: string, candidate: unknown): LiveEventSnapshot {
    const parsed = LiveControlSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid live simulator control.');
    const control = parsed.data;
    if (!this.states.has(eventId)) throw new NotFoundException('Live simulation not found.');
    if (control.action === 'reset') { this.stopTimer(eventId); this.randomState = control.seed; this.mutate(eventId, () => this.initial()); return this.emit(eventId, ['event', 'score', 'market', 'incident']); }
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
      const clockSeconds = Math.min(5_400, state.clockSeconds + seconds);
      const period = clockSeconds >= 2_700 ? '2H' : '1H';
      const event = { ...state.event, clock: this.clock(clockSeconds) };
      const markets = event.markets.map((market, marketIndex) => ({ ...market, selections: market.selections.map((selection, selectionIndex) => {
        if ((state.clockSeconds + marketIndex + selectionIndex) % 3 !== 0 || selection.state === 'locked') return selection;
        const direction = this.nextRandom() > 0.5 ? 1 : -1;
        const odds = Math.max(1.01, Number((selection.odds + direction * 0.05).toFixed(2)));
        return { ...selection, previousOdds: selection.odds, odds, state: 'changed' as const };
      }) }));
      return { ...state, clockSeconds, period, event: { ...event, markets } };
    });
    return this.emit(eventId, ['event', 'market']);
  }

  private score(eventId: string, team: 'home' | 'away') {
    this.mutate(eventId, state => {
      const [home = 0, away = 0] = (state.event.score ?? '0–0').split(/[–-]/).map(Number);
      const score = team === 'home' ? `${home + 1}–${away}` : `${home}–${away + 1}`;
      return { ...state, event: { ...state.event, score }, incidents: [...state.incidents, { id: `incident-${state.sequence + 1}-${team}`, type: 'goal' as const, clockSeconds: state.clockSeconds, team, label: `Goal · ${team === 'home' ? state.event.home : state.event.away}` }] };
    });
    return this.emit(eventId, ['event', 'score', 'incident']);
  }

  private suspend(eventId: string, marketId: string, suspended: boolean) {
    if (!this.get(eventId)?.event.markets.some(market => market.id === marketId)) throw new NotFoundException('Market not found.');
    let found = false;
    this.mutate(eventId, state => ({ ...state, event: { ...state.event, markets: state.event.markets.map(market => market.id !== marketId ? market : (found = true, { ...market, selections: market.selections.map(selection => ({ ...selection, state: suspended ? 'locked' as const : 'active' as const })) })) }, incidents: [...state.incidents, { id: `incident-${state.sequence + 1}-market`, type: suspended ? 'suspension' as const : 'resume' as const, clockSeconds: state.clockSeconds, label: `${marketId} ${suspended ? 'suspended' : 'resumed'}` }] }));
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

  private complete(eventId: string) { this.stopTimer(eventId); this.mutate(eventId, state => ({ ...state, running: false, event: { ...state.event, status: 'finished' }, incidents: [...state.incidents, { id: `incident-${state.sequence + 1}-finished`, type: 'finished' as const, clockSeconds: state.clockSeconds, label: 'Full time' }] })); return this.emit(eventId, ['event', 'score', 'market', 'incident']); }
  private mutate(eventId: string, update: (state: LiveEventSnapshot) => LiveEventSnapshot) { const current = this.states.get(eventId); if (!current) throw new NotFoundException('Live simulation not found.'); this.states.set(eventId, LiveEventSnapshotSchema.parse({ ...update(current), sequence: current.sequence + 1, version: current.version + 1, emittedAt: new Date().toISOString() })); }
  private emit(eventId: string, channels: Array<'event' | 'score' | 'market' | 'incident'>) { const snapshot = this.get(eventId); if (!snapshot) throw new NotFoundException('Live simulation not found.'); for (const listener of this.listeners) listener(snapshot, channels); return snapshot; }
  private stopTimer(eventId: string) { const timer = this.timers.get(eventId); if (timer) clearInterval(timer); this.timers.delete(eventId); }
  private nextRandom() { this.randomState = (1664525 * this.randomState + 1013904223) >>> 0; return this.randomState / 0x1_0000_0000; }
  private clock(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
  private initial(): LiveEventSnapshot { const event: SportsEvent = { id: 'event-dinamo-hajduk', sportId: 'sport-football', leagueId: 'league-hnl-live', sport: 'Football', league: 'Croatia · HNL', startsAt: new Date().toISOString(), status: 'live', clock: '67:00', score: '1–1', home: 'Dinamo Zagreb', away: 'Hajduk Split', features: ['tv'], totalMarketCount: 28, markets: [{ id: 'market-match-result-02', name: 'Match result', features: [], selections: [{ id: 'selection-home-02', label: '1', odds: 2.05, state: 'active', features: [] }, { id: 'selection-draw-02', label: 'X', odds: 2.8, state: 'active', features: [] }, { id: 'selection-away-02', label: '2', odds: 4.1, state: 'active', features: [] }] }] }; return LiveEventSnapshotSchema.parse({ eventId: event.id, version: 1, sequence: 0, clockSeconds: 4_020, period: '2H', acceleration: 15, running: false, event, incidents: [{ id: 'incident-live-kickoff', type: 'kickoff', clockSeconds: 0, label: 'Kick-off' }], emittedAt: new Date().toISOString() }); }
  onModuleDestroy() { for (const eventId of this.timers.keys()) this.stopTimer(eventId); }
}
