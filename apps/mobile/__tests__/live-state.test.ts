import type { LiveEventSnapshot } from '@feg/contracts';
import { mergeLiveSnapshots } from '../live-state';

const snapshot = (version: number, eventId = 'event-test') => ({ version, eventId } as LiveEventSnapshot);
test('live state rejects duplicated and out-of-order updates', () => {
  const latest = snapshot(8);
  expect(mergeLiveSnapshots({ 'event-test': latest }, [snapshot(8), snapshot(3)])['event-test']).toBe(latest);
  expect(mergeLiveSnapshots({ 'event-test': latest }, [snapshot(9)])['event-test'].version).toBe(9);
});
test('live state isolates events and accepts a fresh server snapshot after resync', () => {
  const previous = { 'event-test': snapshot(99) };
  expect(mergeLiveSnapshots(previous, [snapshot(1, 'event-other')])['event-test'].version).toBe(99);
  expect(mergeLiveSnapshots({}, [snapshot(1)])['event-test'].version).toBe(1);
  expect(Object.keys(previous)).toEqual(['event-test']);
});
