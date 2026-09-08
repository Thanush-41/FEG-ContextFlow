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

jest.mock('@feg/api-client', () => ({
  ContextFlowClient: jest.fn().mockImplementation(() => ({
    getEvents: jest.fn((status: string) => Promise.resolve(status === 'live' ? [] : [{
      id: 'event-chelsea-liverpool',
      sport: 'Football',
      league: 'England · Premier League',
      startsAt: '2026-09-08T12:00:00.000Z',
      status: 'scheduled',
      home: 'Chelsea',
      away: 'Liverpool',
      markets: [{
        id: 'market-match-result-01',
        name: 'Match result',
        selections: [
          { id: 'selection-home-01', label: '1', odds: 2.25 },
          { id: 'selection-draw-01', label: 'X', odds: 3.4 },
          { id: 'selection-away-01', label: '2', odds: 2.4 },
        ],
      }],
    }])),
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
