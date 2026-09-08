import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { LiveAdminController } from '../src/live/live-admin.controller.js';
import { LiveAdminGuard } from '../src/live/live-admin.guard.js';
import { LiveSimulationService } from '../src/live/live-simulation.service.js';
import { RealtimeGateway } from '../src/realtime/realtime.gateway.js';

describe('Sprint 9 deterministic live simulation', () => {
  let app: INestApplication;
  let simulator: LiveSimulationService;
  let baseUrl: string;
  const eventId = 'event-dinamo-hajduk';
  const admin = { 'x-demo-admin-key': 'local-demo-admin-key' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [LiveAdminController], providers: [LiveSimulationService, LiveAdminGuard, RealtimeGateway] }).compile();
    simulator = moduleRef.get(LiveSimulationService);
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as { port: number }; baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(() => app.close());

  it('replays seeded clock and price movement exactly', () => {
    simulator.control(eventId, { action: 'reset', seed: 99 });
    const first = simulator.control(eventId, { action: 'step', seconds: 30 });
    simulator.control(eventId, { action: 'reset', seed: 99 });
    const replay = simulator.control(eventId, { action: 'step', seconds: 30 });
    expect(replay.clockSeconds).toBe(first.clockSeconds);
    expect(replay.event.markets).toEqual(first.event.markets);
  });

  it('protects and drives score, price, suspension, pause, and completion controls', async () => {
    await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).send({ action: 'score', team: 'home' }).expect(401);
    const score = await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'score', team: 'home' }).expect(201);
    expect(score.body.event.score).toBe('2–1');
    const priced = await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'price', selectionId: 'selection-home-02', odds: 1.91 }).expect(201);
    expect(priced.body.event.markets[0].selections[0].odds).toBe(1.91);
    const suspended = await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'suspend', marketId: 'market-match-result-02', suspended: true }).expect(201);
    expect(suspended.body.event.markets[0].selections.every((item: { state: string }) => item.state === 'locked')).toBe(true);
    await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'pause' }).expect(201);
    const complete = await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'complete' }).expect(201);
    expect(complete.body.event.status).toBe('finished');
  });

  it('keeps reset versions monotonic and rejects invalid mutations without changing state', () => {
    const previous = simulator.get(eventId)!;
    const reset = simulator.control(eventId, { action: 'reset', seed: 0 });
    expect(reset.version).toBeGreaterThan(previous.version);
    expect(() => simulator.control(eventId, { action: 'suspend', marketId: 'missing-market', suspended: true })).toThrow();
    expect(simulator.get(eventId)).toEqual(reset);
    simulator.control(eventId, { action: 'suspend', marketId: 'market-match-result-02', suspended: true });
    expect(() => simulator.control(eventId, { action: 'price', selectionId: 'selection-home-02', odds: 2 })).toThrow();
    simulator.control(eventId, { action: 'complete' });
    expect(() => simulator.control(eventId, { action: 'score', team: 'away' })).toThrow();
    expect(() => simulator.control(eventId, { action: 'start' })).toThrow();
  });

  it('authenticates, scopes, versions, and resynchronizes Socket.IO subscribers', async () => {
    simulator.control(eventId, { action: 'reset' });
    const socket: Socket = io(`${baseUrl}/realtime`, { transports: ['websocket'], auth: { token: 'live-test-user-001' } });
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    const subscribed = await socket.emitWithAck('events.subscribe', { eventIds: [eventId] });
    expect(subscribed.ok).toBe(true); expect(subscribed.snapshots[0].eventId).toBe(eventId);
    const pushed = new Promise<any>(resolve => socket.once('market.updated', resolve));
    const next = simulator.control(eventId, { action: 'step', seconds: 15 });
    const envelope = await pushed;
    expect(envelope.sequence).toBe(next.sequence); expect(envelope.version).toBe(next.version);
    socket.close();
    const recovered: Socket = io(`${baseUrl}/realtime`, { transports: ['websocket'], auth: { token: 'live-test-user-001' } });
    await new Promise<void>((resolve, reject) => { recovered.once('connect', resolve); recovered.once('connect_error', reject); });
    const snapshot = await recovered.emitWithAck('events.subscribe', { eventIds: [eventId] });
    expect(snapshot.snapshots[0].sequence).toBe(next.sequence);
    recovered.close();
  });
});
