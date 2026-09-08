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

test('increments, decrements, and resets the counter', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const byTestId = (testID: string): ReactTestInstance =>
    renderer.root.findByProps({ testID });

  expect(byTestId('counter-value').props.children).toBe(0);

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
});
