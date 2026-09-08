import type { LiveEventSnapshot } from '@feg/contracts';

// Ignore duplicates/out-of-order channels. An HTTP resync replaces this map after
// reconnect so a newly restarted server may begin a fresh version sequence.
export function mergeLiveSnapshots(current: Record<string, LiveEventSnapshot>, updates: LiveEventSnapshot[]) {
  const next = { ...current };
  for (const snapshot of updates) {
    if (!next[snapshot.eventId] || snapshot.version > next[snapshot.eventId].version) next[snapshot.eventId] = snapshot;
  }
  return next;
}
