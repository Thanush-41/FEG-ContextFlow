/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import App, { LiveScreen } from '../App';
jest.mock('../useLiveFeed', () => ({ useLiveFeed: () => ({ snapshots: {}, status: 'stale', wallet: null, ticket: null, notification: null }) }));

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = jest.requireActual('react-native');
  return { FlashList: FlatList };
});

jest.mock('@feg/api-client', () => ({
  ContextFlowClient: jest.fn().mockImplementation(() => {
    let slip = { id: 'slip-guest-device-0001-1', ownerId: 'guest-device-0001', tab: 1, version: 0, mode: 'accumulator', stake: { currency: 'DCO', minorUnits: 100 }, selections: [] as any[], totals: null as any, warnings: [] as any[], updatedAt: '2026-09-08T12:00:00.000Z' };
    let placedTickets: any[] = [];
    const withTotals = (next: typeof slip) => ({ ...next, totals: next.selections.length ? { lines: 1, totalOdds: next.selections.reduce((total, item) => total * item.currentOdds, 1), stakeMinorUnits: next.stake.minorUnits, grossReturnMinorUnits: 648, bonusMinorUnits: 0, feeMinorUnits: 0, taxMinorUnits: 0, potentialReturnMinorUnits: 648 } : null });
    return ({
    getEvents: jest.fn(() => Promise.resolve([])),
    getOffer: jest.fn((timeFilter: string) => Promise.resolve({
      timeFilter,
      featured: [],
      sports: [{ id: 'sport-football', name: 'Football', eventCount: 1 }],
      cache: { source: 'fixture', generatedAt: '2026-09-08T12:00:00.000Z', maxAgeSeconds: 30 },
      pagination: { nextCursor: null, total: 1 },
      leagues: [{ id: 'league-premier', sportId: 'sport-football', name: 'England · Premier League', pinned: false, events: [{
      id: 'event-chelsea-liverpool',
      sportId: 'sport-football',
      leagueId: 'league-premier',
      sport: 'Football',
      league: 'England · Premier League',
      startsAt: '2026-09-08T12:00:00.000Z',
      status: 'scheduled',
      home: 'Chelsea',
      away: 'Liverpool',
      features: ['betBuilder'],
      totalMarketCount: 38,
      markets: [{
        id: 'market-match-result-01',
        name: 'Match result',
        features: [],
        selections: [
          { id: 'selection-home-01', label: '1', odds: 2.25, state: 'active', features: [] },
          { id: 'selection-draw-01', label: 'X', odds: 3.4, previousOdds: 3.3, state: 'changed', features: [] },
          { id: 'selection-away-01', label: '2', odds: 2.4, state: 'locked', features: [] },
        ],
      }],
    }] }],
    })),
    getEventDetail: jest.fn(() => Promise.resolve({
      version: 1,
      event: {
        id: 'event-chelsea-liverpool', sport: 'Football', league: 'England · Premier League', startsAt: '2026-09-08T12:00:00.000Z', status: 'scheduled', home: 'Chelsea', away: 'Liverpool', features: ['betBuilder'],
        markets: [{ id: 'market-match-result-01', name: 'Match result', features: [], selections: [{ id: 'selection-home-01', label: '1', odds: 2.25, state: 'active', features: [] }, { id: 'selection-away-01', label: '2', odds: 2.4, state: 'active', features: [] }], }],
      },
      periods: [],
      result: null,
      markets: [
        { id: 'detail-market-main', group: 'main', name: 'Match result', layout: 'threeWay', status: 'open', outcomes: [{ id: 'detail-main-home', label: '1', odds: 2, state: 'active', features: [], compatibilityGroup: 'main', priceHistory: [] }, { id: 'detail-main-away', label: '2', odds: 3, state: 'active', features: [], compatibilityGroup: 'main', priceHistory: [] }] },
        { id: 'detail-market-goals', group: 'goals', name: 'Total goals', layout: 'twoWay', status: 'open', outcomes: [{ id: 'detail-goals-over', label: 'Over', odds: 1.8, state: 'active', features: [], compatibilityGroup: 'goals', priceHistory: [] }, { id: 'detail-goals-under', label: 'Under', odds: 1.9, state: 'active', features: [], compatibilityGroup: 'goals', priceHistory: [] }] },
        ...['handicap', 'periods', 'players'].map((group, index) => ({ id: `detail-market-${group}`, group, name: group, layout: 'twoWay', status: 'open', outcomes: [{ id: `detail-${index}-a`, label: 'A', odds: 1.8, state: 'active', features: [], compatibilityGroup: `${group}-a`, priceHistory: [] }, { id: `detail-${index}-b`, label: 'B', odds: 1.9, state: 'active', features: [], compatibilityGroup: `${group}-b`, priceHistory: [] }] })),
      ],
      statistics: [{ label: 'Possession', home: 54, away: 46 }], form: { home: ['W'], away: ['L'] }, headToHead: [],
      lineups: { home: ['Chelsea Player 1'], away: ['Liverpool Player 1'] }, relatedEvents: [],
      cache: { maxAgeSeconds: 60, generatedAt: '2026-09-08T12:00:00.000Z' },
    })),
    validateBetBuilder: jest.fn((_eventId: string, selectionIds: string[]) => Promise.resolve({ valid: true, combinedOdds: selectionIds.length === 2 ? 3.24 : 2, reasons: [] })),
    getSlip: jest.fn((_ownerId: string, tab: number) => Promise.resolve(tab === 1 ? slip : { ...slip, id: `slip-guest-device-0001-${tab}`, tab, version: 0, selections: [], totals: null })),
    addSlipSelection: jest.fn((_ownerId: string, _tab: number, input: any) => {
      const changed = input.selectionId === 'selection-home-01';
      const selection = { ...input, eventLabel: 'Chelsea · Liverpool', marketLabel: input.marketId, selectionLabel: input.selectionId, currentOdds: changed ? input.acceptedOdds + 0.1 : input.acceptedOdds, state: changed ? 'changed' : 'active' };
      slip = withTotals({ ...slip, version: slip.version + 1, selections: [...slip.selections.filter(item => item.marketId !== input.marketId), selection], warnings: changed ? [{ code: 'ODDS_CHANGED', message: 'Review the new price.', selectionIds: [input.selectionId], recoverable: true }] : slip.warnings });
      return Promise.resolve(slip);
    }),
    removeSlipSelection: jest.fn((_ownerId: string, _tab: number, selectionId: string) => { slip = withTotals({ ...slip, version: slip.version + 1, selections: slip.selections.filter(item => item.selectionId !== selectionId) }); return Promise.resolve(slip); }),
    updateSlip: jest.fn((_ownerId: string, _tab: number, input: any) => { slip = withTotals({ ...slip, version: slip.version + 1, mode: input.mode ?? slip.mode, stake: input.stakeMinorUnits === undefined ? slip.stake : { currency: 'DCO', minorUnits: input.stakeMinorUnits }, warnings: input.acceptOddsChanges ? [] : slip.warnings }); return Promise.resolve(slip); }),
    clearSlip: jest.fn(() => { slip = { ...slip, version: slip.version + 1, selections: [], totals: null, warnings: [] }; return Promise.resolve(slip); }),
    getWallet: jest.fn(() => Promise.resolve({ userId: 'guest-device-0001', currency: 'DCO', availableMinorUnits: 100000, bonusMinorUnits: 10000, updatedAt: '2026-09-08T12:00:00.000Z' })),
    getWalletLedger: jest.fn(() => Promise.resolve([])),
    depositDemoFunds: jest.fn(),
    withdrawDemoFunds: jest.fn(),
    getPlacedTickets: jest.fn(() => Promise.resolve(placedTickets)),
    findPlacedTicket: jest.fn((_ownerId: string, code: string) => Promise.resolve(placedTickets.find(item => item.code === code))),
    getCashoutQuote: jest.fn((_ownerId: string, ticketId: string) => Promise.resolve({ id: 'quote-test-0001', ticketId, amount: { currency: 'DCO', minorUnits: 150 }, expiresAt: '2026-09-08T12:00:30.000Z' })),
    cashoutTicket: jest.fn((_ownerId: string, ticketId: string) => { const current = placedTickets.find(item => item.id === ticketId); const resolved = { ...current, status: 'cashed_out', resolution: 'cashout', settledAt: '2026-09-08T12:00:10.000Z', payout: { currency: 'DCO', minorUnits: 150 } }; placedTickets = [resolved]; return Promise.resolve(resolved); }),
    copyTicketToSlip: jest.fn(() => Promise.resolve({ slip, unavailableSelectionIds: [], repricedSelectionIds: [] })),
    placeSlipBet: jest.fn(() => { const placed = { id: 'ticket-test-0001', code: 'FEG-TEST-000001', status: 'open', placedAt: '2026-09-08T12:00:00.000Z', selections: slip.selections.map(item => ({ eventId: item.eventId, marketId: item.marketId, selectionId: item.selectionId, acceptedOdds: item.currentOdds })), stake: slip.stake, potentialReturn: { currency: 'DCO', minorUnits: slip.totals?.potentialReturnMinorUnits ?? 0 }, calculation: slip.totals, walletBeforeMinorUnits: 100000, walletAfterMinorUnits: 99900 }; placedTickets = [placed]; slip = { ...slip, version: slip.version + 1, selections: [], totals: null, warnings: [] }; return Promise.resolve(placed); }),
  }); }),
}));

test('renders the sportsbook shell and preserves the voice word counter', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => { await new Promise<void>(resolve => setTimeout(() => resolve(), 0)); });

  const byTestId = (testID: string): ReactTestInstance =>
    renderer.root.findByProps({ testID });

  expect(byTestId('counter-value').props.children).toBe(0);
  expect(byTestId('event-chelsea-liverpool')).toBeTruthy();
  expect(byTestId('offer-list')).toBeTruthy();
  expect(byTestId('slip-sheet')).toBeTruthy();
  expect(byTestId('odd-chelsea-liverpool-2').props.accessibilityState.disabled).toBe(true);

  await ReactTestRenderer.act(async () => byTestId('favorite-chelsea-liverpool').props.onPress());
  expect(byTestId('favorite-chelsea-liverpool').props.accessibilityLabel).toContain('Remove');
  await ReactTestRenderer.act(async () => byTestId('toggle-league-premier').props.onPress());
  expect(renderer!.root.findAllByProps({ testID: 'event-chelsea-liverpool' })).toHaveLength(0);
  await ReactTestRenderer.act(async () => byTestId('toggle-league-premier').props.onPress());
  expect(byTestId('event-chelsea-liverpool')).toBeTruthy();

  await ReactTestRenderer.act(async () =>
    byTestId('period-all').props.onPress(),
  );

  await ReactTestRenderer.act(async () => byTestId('open-event-chelsea-liverpool').props.onPress());
  expect(byTestId('event-detail-screen')).toBeTruthy();
  await ReactTestRenderer.act(async () => undefined);
  expect(byTestId('detail-favorite').props.accessibilityState.selected).toBe(false);
  await ReactTestRenderer.act(async () => byTestId('detail-favorite').props.onPress());
  expect(byTestId('detail-favorite').props.accessibilityState.selected).toBe(true);
  await ReactTestRenderer.act(async () => byTestId('builder-detail-main-home').props.onPress());
  await ReactTestRenderer.act(async () => byTestId('builder-detail-goals-over').props.onPress());
  expect(byTestId('add-builder-button').props.disabled).toBe(false);
  await ReactTestRenderer.act(async () => byTestId('detail-stats').props.onPress());
  expect(renderer!.root.findByProps({ children: 'Possession' })).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('detail-lineups').props.onPress());
  expect(renderer!.root.findByProps({ children: 'Chelsea Player 1' })).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('detail-markets').props.onPress());
  await ReactTestRenderer.act(async () => { byTestId('add-builder-button').props.onPress(); await new Promise<void>(resolve => setTimeout(() => resolve(), 30)); });
  expect(byTestId('open-betslip-button')).toBeTruthy();
  expect(byTestId('slip-count').props.children).toEqual(['BET SLIP · ', 2, ' PICK', 'S']);
  expect(byTestId('slip-mode-system')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('slip-mode-system').props.onPress());
  expect(byTestId('stake-input')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('slip-full-button').props.onPress());
  expect(byTestId('slip-sheet').props.style).toBeTruthy();

  await ReactTestRenderer.act(async () =>
    byTestId('voice-panel-button').props.onPress(),
  );

  await ReactTestRenderer.act(async () =>
    byTestId('increase-button').props.onPress(),
  );
  expect(byTestId('counter-value').props.children).toBe(1);

  await ReactTestRenderer.act(async () =>
    byTestId('decrease-button').props.onPress(),
  );
  expect(byTestId('counter-value').props.children).toBe(0);

  await ReactTestRenderer.act(async () =>
    byTestId('increase-button').props.onPress(),
  );
  await ReactTestRenderer.act(async () =>
    byTestId('reset-button').props.onPress(),
  );
  expect(byTestId('counter-value').props.children).toBe(0);

  await ReactTestRenderer.act(async () =>
    byTestId('odd-chelsea-liverpool-0').props.onPress(),
  );
  expect(byTestId('open-betslip-button')).toBeTruthy();
  expect(byTestId('accept-odds-button')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('accept-odds-button').props.onPress());

  await ReactTestRenderer.act(async () => byTestId('reconcile-slip-button').props.onPress());
  await ReactTestRenderer.act(async () =>
    byTestId('place-demo-bet-button').props.onPress(),
  );
  expect(renderer!.root.findByProps({ children: 'Demo ticket confirmed' })).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('ticket-detail-back').props.onPress());
  expect(renderer!.root.findByProps({ children: 'MY BETS' })).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('ticket-row-ticket-test-0001').props.onPress());
  await ReactTestRenderer.act(async () => { await byTestId('request-cashout-button').props.onPress(); });
  expect(byTestId('confirm-cashout-button')).toBeTruthy();
  await ReactTestRenderer.act(async () => { await byTestId('confirm-cashout-button').props.onPress(); });
  expect(renderer!.root.findByProps({ children: 'Demo ticket cashed out' })).toBeTruthy();

  await ReactTestRenderer.act(async () =>
    byTestId('tab-live').props.onPress(),
  );
  expect(byTestId('live-screen')).toBeTruthy();

  await ReactTestRenderer.act(async () =>
    byTestId('tab-casino').props.onPress(),
  );
  expect(byTestId('casino-screen')).toBeTruthy();

  await ReactTestRenderer.act(async () =>
    byTestId('tab-menu').props.onPress(),
  );
  expect(byTestId('menu-screen')).toBeTruthy();
});

test('filters the live board across football, basketball, and tennis', async () => {
  const events = [
    { id: 'football', label: 'LIVE', league: 'CROATIA · HNL', starts: "23' · 1–0", home: 'Dinamo', away: 'Hajduk', markets: [{ label: '1', value: '1.80', state: 'active' }], features: [], totalMarketCount: 1 },
    { id: 'basketball', label: 'LIVE', league: 'ABA LEAGUE', starts: 'Q2 · 31–28', home: 'Cibona', away: 'Zadar', markets: [{ label: '1', value: '1.65', state: 'active' }], features: [], totalMarketCount: 1 },
    { id: 'tennis', label: 'LIVE', league: 'WTA ZAGREB', starts: 'SET 2 · 3–2', home: 'Martic', away: 'Vekic', markets: [{ label: '1', value: '2.10', state: 'active' }], features: [], totalMarketCount: 1 },
  ] as any;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => { renderer = ReactTestRenderer.create(<LiveScreen events={events} selectedOdds={new Set()} onSelect={jest.fn()} onOpen={jest.fn()} />); });
  const basketball = renderer!.root.findByProps({ testID: 'live-filter-basketball' });
  await ReactTestRenderer.act(async () => basketball.props.onPress());
  expect(renderer!.root.findByProps({ children: 'Cibona' })).toBeTruthy();
  expect(renderer!.root.findAllByProps({ children: 'Dinamo' })).toHaveLength(0);
  expect(renderer!.root.findByProps({ testID: 'live-event-count' }).props.children).toEqual([1, ' EVENTS']);
});
