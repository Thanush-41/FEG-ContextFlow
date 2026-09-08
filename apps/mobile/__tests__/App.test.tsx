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
    let profile = { userId: 'guest-device-0001', displayName: 'Demo Player', locale: 'en', oddsFormat: 'decimal', theme: 'dark', notificationsEnabled: true, transcriptStorageEnabled: false, sessionReminderMinutes: 60, maxDemoStakeMinorUnits: 10000, createdAt: '2026-09-08T12:00:00.000Z', updatedAt: '2026-09-08T12:00:00.000Z' };
    let promotions = [{ id: 'promo-live-boost', title: 'Live Match Boost', summary: 'Explore one featured live market.', rewardLabel: 'DEMO BOOST', terms: ['Demo coins only.'], eligible: true, optedIn: false, expiresAt: '2027-01-31T23:59:59.000Z', demoOnly: true }];
    let lottoEntries: any[] = [];
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
    getCasinoGames: jest.fn(() => Promise.resolve([
      { id: 'casino-crash-flight', name: 'Sky Crash', type: 'crash', tagline: 'Watch the multiplier climb.', volatility: 'high', demoOnly: true },
      { id: 'casino-lucky-dice', name: 'Lucky Dice', type: 'dice', tagline: 'Roll deterministic dice.', volatility: 'low', demoOnly: true },
      { id: 'casino-triple-slots', name: 'Triple Pulse', type: 'slots', tagline: 'Spin three neon reels.', volatility: 'medium', demoOnly: true },
    ])),
    playCasinoGame: jest.fn((gameId: string) => Promise.resolve({ id: 'casino-round-test', gameId, ownerId: 'guest-device-0001', round: 1, outcomeLabel: 'Flight ended at 2.50×', multiplier: 2.5, createdAt: '2026-09-08T12:00:00.000Z', demoOnly: true })),
    getDemoProfile: jest.fn(() => Promise.resolve(profile)),
    updateDemoProfile: jest.fn((_userId: string, input: any) => { profile = { ...profile, ...input, updatedAt: '2026-09-08T12:01:00.000Z' }; return Promise.resolve(profile); }),
    createDemoSession: jest.fn(() => Promise.resolve({ id: 'session-current-0001', userId: 'guest-device-0001', deviceName: 'iPhone / iOS', current: true, createdAt: '2026-09-08T12:00:00.000Z', lastSeenAt: '2026-09-08T12:00:00.000Z' })),
    getDemoSessions: jest.fn(() => Promise.resolve([{ id: 'session-current-0001', userId: 'guest-device-0001', deviceName: 'iPhone / iOS', current: true, createdAt: '2026-09-08T12:00:00.000Z', lastSeenAt: '2026-09-08T12:00:00.000Z' }])),
    revokeDemoSession: jest.fn(),
    getPromotions: jest.fn(() => Promise.resolve(promotions)),
    optInPromotion: jest.fn((promotionId: string) => { promotions = promotions.map(item => item.id === promotionId ? { ...item, optedIn: true } : item); return Promise.resolve(promotions[0]); }),
    getContent: jest.fn((kind: string) => Promise.resolve([{ id: `${kind}-article`, kind, title: `${kind} title`, summary: `${kind} summary`, body: [`${kind} body`], publishedAt: '2026-09-09T00:00:00.000Z' }])),
    getContentArticle: jest.fn(),
    getCommunityFeed: jest.fn(() => Promise.resolve([{ id: 'community-live-derby', authorName: 'Mara', message: 'A shared demo ticket.', createdAt: '2026-09-09T00:30:00.000Z', reactionCount: 18, reactedByMe: false, sharedSelections: [{ eventId: 'event-chelsea-liverpool', marketId: 'market', selectionId: 'home', acceptedOdds: 1.55 }], demoOnly: true }])),
    toggleCommunityReaction: jest.fn((postId: string) => Promise.resolve({ id: postId, authorName: 'Mara', message: 'A shared demo ticket.', createdAt: '2026-09-09T00:30:00.000Z', reactionCount: 19, reactedByMe: true, sharedSelections: [{ eventId: 'event-chelsea-liverpool', marketId: 'market', selectionId: 'home', acceptedOdds: 1.55 }], demoOnly: true })),
    copyCommunityPostToSlip: jest.fn(() => { slip = withTotals({ ...slip, version: slip.version + 1, selections: [{ eventId: 'event-chelsea-liverpool', marketId: 'market', selectionId: 'home', eventLabel: 'Chelsea · Liverpool', marketLabel: 'Match result', selectionLabel: '1', acceptedOdds: 1.55, currentOdds: 1.55, state: 'active' }] }); return Promise.resolve({ slip, unavailableSelectionIds: [] }); }),
    getLottoDraws: jest.fn(() => Promise.resolve([{ id: 'lotto-draw-friday', title: 'Friday Five', drawAt: '2026-09-11T19:00:00.000Z', status: 'open', jackpotDcoMinorUnits: 250000000, winningNumbers: null, demoOnly: true }, { id: 'lotto-draw-last', title: 'Tuesday Five', drawAt: '2026-09-08T19:00:00.000Z', status: 'drawn', jackpotDcoMinorUnits: 180000000, winningNumbers: [4, 11, 18, 23, 32], demoOnly: true }])),
    getLottoEntries: jest.fn(() => Promise.resolve(lottoEntries)),
    createLottoEntry: jest.fn((drawId: string, numbers: number[], idempotencyKey: string) => { const entry = { id: 'lotto-entry-test', ownerId: 'guest-device-0001', drawId, numbers, status: 'pending', createdAt: '2026-09-09T00:00:00.000Z', idempotencyKey, demoOnly: true }; lottoEntries = [entry]; return Promise.resolve(entry); }),
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
  await ReactTestRenderer.act(async () => { await new Promise<void>(resolve => setTimeout(resolve, 0)); });
  expect(byTestId('casino-game-crash')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('casino-game-crash').props.onPress());
  await ReactTestRenderer.act(async () => { await byTestId('play-casino-button').props.onPress(); });
  expect(byTestId('casino-result').props.children).toBe('2.50×');

  await ReactTestRenderer.act(async () =>
    byTestId('tab-menu').props.onPress(),
  );
  expect(byTestId('menu-screen')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('open-profile-button').props.onPress());
  expect(byTestId('profile-screen')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('profile-name-input').props.onChangeText('Context Captain'));
  await ReactTestRenderer.act(async () => { await byTestId('save-profile-button').props.onPress(); });
  expect(byTestId('profile-name-input').props.value).toBe('Context Captain');
  await ReactTestRenderer.act(async () => { await byTestId('setting-notifications').props.onPress(); });
  expect(byTestId('setting-notifications').findAllByProps({ children: 'OFF' }).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => byTestId('profile-wallet-button').props.onPress());
  expect(byTestId('wallet-screen')).toBeTruthy();

  await ReactTestRenderer.act(async () => byTestId('tab-sport').props.onPress());
  await ReactTestRenderer.act(async () => byTestId('tab-menu').props.onPress());
  await ReactTestRenderer.act(async () => { await byTestId('open-promotions-button').props.onPress(); });
  expect(byTestId('promotion-promo-live-boost')).toBeTruthy();
  await ReactTestRenderer.act(async () => { await byTestId('opt-in-promo-live-boost').props.onPress(); });
  expect(byTestId('promotion-promo-live-boost').findAllByProps({ children: 'JOINED' }).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => byTestId('discovery-back').props.onPress());
  await ReactTestRenderer.act(async () => { await byTestId('open-news-button').props.onPress(); });
  expect(byTestId('article-news-article')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('article-news-article').props.onPress());
  expect(byTestId('article-screen')).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'news body' })).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('article-back').props.onPress());
  await ReactTestRenderer.act(async () => byTestId('discovery-back').props.onPress());
  await ReactTestRenderer.act(async () => { await byTestId('open-community-button').props.onPress(); });
  expect(byTestId('community-post-community-live-derby')).toBeTruthy();
  await ReactTestRenderer.act(async () => { await byTestId('react-community-live-derby').props.onPress(); });
  expect(byTestId('react-community-live-derby').props.accessibilityLabel).toBe('Remove reaction · 19');
  await ReactTestRenderer.act(async () => { await byTestId('copy-community-community-live-derby').props.onPress(); });
  await ReactTestRenderer.act(async () => { await new Promise<void>(resolve => setTimeout(resolve, 50)); });
  expect(byTestId('offer-list')).toBeTruthy();
  expect(byTestId('slip-count').props.children).toEqual(['BET SLIP · ', 1, ' PICK', '']);
  await ReactTestRenderer.act(async () => byTestId('tab-menu').props.onPress());
  await ReactTestRenderer.act(async () => { await byTestId('open-lotto-button').props.onPress(); });
  expect(byTestId('lotto-draw-lotto-draw-friday')).toBeTruthy();
  await ReactTestRenderer.act(async () => byTestId('open-lotto-lotto-draw-friday').props.onPress());
  await ReactTestRenderer.act(async () => byTestId('lotto-quick-pick').props.onPress());
  expect(byTestId('save-lotto-entry').props.disabled).toBe(false);
  await ReactTestRenderer.act(async () => { await byTestId('save-lotto-entry').props.onPress(); });
  expect(byTestId('lotto-entry-lotto-entry-test')).toBeTruthy();
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
