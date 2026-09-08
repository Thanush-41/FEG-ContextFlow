import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { LiveEventSnapshotSchema, type LiveEventSnapshot } from '@feg/contracts';
import { ContextFlowClient } from '@feg/api-client';
import { mergeLiveSnapshots } from './live-state';

export function useLiveFeed(baseUrl: string, ownerId: string) {
  const [snapshots, setSnapshots] = useState<Record<string, LiveEventSnapshot>>({});
  const [status, setStatus] = useState<'connecting' | 'current' | 'stale'>('connecting');
  useEffect(() => {
    const client = new ContextFlowClient(baseUrl, async () => ownerId);
    const socket = io(`${baseUrl}/realtime`, { autoConnect: false, transports: ['websocket'], auth: { token: ownerId } });
    let disposed = false;
    let generation = 0;
    let syncing = false;
    let pending: LiveEventSnapshot[] = [];
    let batch: ReturnType<typeof setTimeout> | undefined;
    const parse = (values: unknown): LiveEventSnapshot[] => Array.isArray(values) ? values.flatMap(value => {
      const result = LiveEventSnapshotSchema.safeParse(value); return result.success ? [result.data] : [];
    }) : [];
    const resync = async () => {
      const request = ++generation;
      syncing = true;
      setStatus('connecting');
      try {
        const fetched = parse(await client.get('/api/live/snapshots'));
        if (disposed || request !== generation || !socket.connected) return;
        const response = await socket.timeout(5000).emitWithAck('events.subscribe', { eventIds: fetched.map(item => item.eventId) });
        if (disposed || request !== generation) return;
        if (!response.ok) throw new Error('Subscription rejected');
        // Subscribe ACK closes the fetch/subscribe gap with a newer snapshot.
        const fresh = mergeLiveSnapshots({}, [...fetched, ...parse(response.snapshots), ...pending]);
        pending = [];
        syncing = false;
        setSnapshots(fresh); setStatus('current');
      } catch { if (!disposed && request === generation) { syncing = false; setStatus('stale'); } }
    };
    socket.on('connect', resync);
    const stale = () => { generation++; pending = []; if (!disposed) setStatus('stale'); };
    socket.on('disconnect', stale); socket.on('connect_error', stale);
    socket.on('event.updated', envelope => {
      const values = parse([envelope?.payload]);
      pending.push(...values);
      if (!batch) batch = setTimeout(() => {
        batch = undefined;
        if (syncing) return;
        const updates = pending; pending = [];
        if (!disposed) setSnapshots(current => mergeLiveSnapshots(current, updates));
      }, 100);
    });
    const lifecycle = AppState.addEventListener('change', next => {
      if (next === 'active') { if (socket.connected) resync(); else socket.connect(); }
      else { socket.disconnect(); stale(); }
    });
    socket.connect();
    const retry = setInterval(() => { if (socket.connected && AppState.currentState === 'active') resync(); }, 15000);
    return () => { disposed = true; generation++; clearInterval(retry); if (batch) clearTimeout(batch); lifecycle.remove(); socket.removeAllListeners(); socket.disconnect(); };
  }, [baseUrl, ownerId]);
  return { snapshots, status };
}
