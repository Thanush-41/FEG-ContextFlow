/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import App from '../App';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = jest.requireActual('react-native');
  return { FlashList: FlatList };
});

jest.mock('@feg/api-client', () => ({
  ContextFlowClient: jest.fn().mockImplementation(() => ({
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
    placeDemoBet: jest.fn(() => Promise.resolve({ id: 'ticket-test-0001' })),
  })),
}));

test('renders the sportsbook shell and preserves the voice word counter', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const byTestId = (testID: string): ReactTestInstance =>
    renderer.root.findByProps({ testID });

  expect(byTestId('counter-value').props.children).toBe(0);
  expect(byTestId('event-chelsea-liverpool')).toBeTruthy();
  expect(byTestId('offer-list')).toBeTruthy();
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

  await ReactTestRenderer.act(async () =>
    byTestId('open-betslip-button').props.onPress(),
  );
  await ReactTestRenderer.act(async () =>
    byTestId('place-demo-bet-button').props.onPress(),
  );
  expect(renderer!.root.findByProps({ children: 'Demo bet accepted' })).toBeTruthy();

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
