import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { useLiveFeed } from '../useLiveFeed';

const mockHandlers: Record<string, (...args: any[]) => void> = {};
let mockSnapshot: any;
const mockSocket: { connected: boolean; on: jest.Mock; timeout: jest.Mock; emitWithAck: jest.Mock; connect: jest.Mock; disconnect: jest.Mock; removeAllListeners: jest.Mock } = {
  connected: true,
  on: jest.fn((name, fn) => { mockHandlers[name] = fn; }),
  timeout: jest.fn(() => mockSocket),
  emitWithAck: jest.fn(async () => ({ ok: true, snapshots: [mockSnapshot] })),
  connect: jest.fn(), disconnect: jest.fn(), removeAllListeners: jest.fn(),
};
jest.mock('socket.io-client', () => ({ io: () => mockSocket }));
jest.mock('@feg/api-client', () => ({ ContextFlowClient: jest.fn(() => ({ get: async () => [mockSnapshot] })) }));
jest.mock('@feg/contracts', () => ({ LiveEventSnapshotSchema: { safeParse: (value: any) => ({ success: Boolean(value?.eventId), data: value }) } }));

let feed: ReturnType<typeof useLiveFeed>;
function Probe() { feed = useLiveFeed('http://localhost:3000', 'demo-user'); return null; }

test('resyncs on reconnect, batches newer prices, and cleans up on unmount', async () => {
  jest.useFakeTimers();
  mockSnapshot = { eventId: 'event-demo', version: 8, event: { score: '1–1' } };
  let lifecycle: (state: AppStateStatus) => void = () => {};
  const remove = jest.fn();
  const lifecycleSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => { lifecycle = fn; return { remove }; });
  let root!: Renderer.ReactTestRenderer;
  await act(async () => { root = Renderer.create(<Probe />); });
  await act(async () => { await mockHandlers.connect(); });
  expect(feed.status).toBe('current');
  expect(feed.snapshots['event-demo'].version).toBe(8);
  await act(async () => {
    mockHandlers['event.updated']({ payload: { ...mockSnapshot, version: 10 } });
    mockHandlers['event.updated']({ payload: { ...mockSnapshot, version: 9 } });
    jest.advanceTimersByTime(100);
  });
  expect(feed.snapshots['event-demo'].version).toBe(10);
  await act(async () => { mockHandlers.disconnect(); });
  expect(feed.status).toBe('stale');
  mockSnapshot = { ...mockSnapshot, version: 1 };
  await act(async () => { await mockHandlers.connect(); });
  expect(feed.snapshots['event-demo'].version).toBe(1);
  await act(async () => { lifecycle('background'); });
  expect(mockSocket.disconnect).toHaveBeenCalled();
  expect(feed.status).toBe('stale');
  await act(async () => { root.unmount(); });
  expect(remove).toHaveBeenCalled();
  expect(mockSocket.removeAllListeners).toHaveBeenCalled();
  lifecycleSpy.mockRestore();
  jest.useRealTimers();
});
