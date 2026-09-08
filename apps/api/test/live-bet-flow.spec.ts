import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';
import { EventDetailService } from '../src/event-detail/event-detail.service.js';
import { LiveAdminController } from '../src/live/live-admin.controller.js';
import { LiveAdminGuard } from '../src/live/live-admin.guard.js';
import { LiveController } from '../src/live/live.controller.js';
import { LiveSimulationService } from '../src/live/live-simulation.service.js';
import { RealtimeGateway } from '../src/realtime/realtime.gateway.js';
import { SlipsController } from '../src/slips/slips.controller.js';
import { SlipsService } from '../src/slips/slips.service.js';
import { SportsService } from '../src/sports/sports.service.js';
import { TicketPlacementController } from '../src/tickets/ticket-placement.controller.js';
import { TicketPlacementService } from '../src/tickets/ticket-placement.service.js';
import { WalletController } from '../src/wallet/wallet.controller.js';
import { WalletService } from '../src/wallet/wallet.service.js';

describe('Sprint 9 live bet journey', () => {
  let app: INestApplication;
  let socket: Socket;
  const user = 'live-betting-user-001';
  const auth = { Authorization: `Bearer ${user}` };
  const admin = { 'x-demo-admin-key': 'local-demo-admin-key' };
  const eventId = 'event-dinamo-hajduk';
  const marketId = 'market-match-result-02';
  const selectionId = 'selection-home-02';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LiveController, LiveAdminController, SlipsController, WalletController, TicketPlacementController],
      providers: [LiveSimulationService, RealtimeGateway, SportsService, EventDetailService, SlipsService, WalletService, TicketPlacementService, DemoAuthGuard, LiveAdminGuard],
    }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as { port: number };
    socket = io(`http://127.0.0.1:${address.port}/realtime`, { transports: ['websocket'], auth: { token: user } });
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  });
  afterAll(async () => { socket.close(); await app.close(); });

  it('selects live odds, reviews a price change, recovers suspension, confirms, and publishes the receipt', async () => {
    await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'reset', seed: 5 }).expect(201);
    const snapshots = await request(app.getHttpServer()).get('/api/live/snapshots').expect(200);
    expect(snapshots.body).toHaveLength(3);
    const added = await request(app.getHttpServer()).post(`/api/slips/${user}/tabs/1/selections`).send({ eventId, marketId, selectionId, acceptedOdds: 2.05, expectedVersion: 0 }).expect(201);
    expect(added.body.warnings).toEqual([]);

    await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'price', selectionId, odds: 1.95 }).expect(201);
    const repriced = await request(app.getHttpServer()).get(`/api/slips/${user}/tabs/1`).expect(200);
    expect(repriced.body.selections[0]).toMatchObject({ acceptedOdds: 2.05, currentOdds: 1.95, state: 'changed' });
    expect(repriced.body.warnings[0].code).toBe('ODDS_CHANGED');
    const accepted = await request(app.getHttpServer()).patch(`/api/slips/${user}/tabs/1`).send({ expectedVersion: repriced.body.version, acceptOddsChanges: true }).expect(200);
    expect(accepted.body.warnings).toEqual([]);

    await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'suspend', marketId, suspended: true }).expect(201);
    const suspended = await request(app.getHttpServer()).get(`/api/slips/${user}/tabs/1`).expect(200);
    expect(suspended.body.warnings[0].code).toBe('SELECTION_SUSPENDED');
    await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send({ ownerId: user, tab: 1, expectedVersion: suspended.body.version, idempotencyKey: 'fa40ed36-b023-4ec8-9a33-c2aa02fc91ee' }).expect(400);

    await request(app.getHttpServer()).post(`/api/admin/live/${eventId}/control`).set(admin).send({ action: 'suspend', marketId, suspended: false }).expect(201);
    const resumed = await request(app.getHttpServer()).get(`/api/slips/${user}/tabs/1`).expect(200);
    expect(resumed.body.warnings).toEqual([]);
    const before = await request(app.getHttpServer()).get(`/api/wallets/${user}`).set(auth).expect(200);
    const ticketPush = new Promise<any>(resolve => socket.once('ticket.created', resolve));
    const walletPush = new Promise<any>(resolve => socket.once('wallet.updated', resolve));
    const notificationPush = new Promise<any>(resolve => socket.once('notification.updated', resolve));
    const placed = await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send({ ownerId: user, tab: 1, expectedVersion: resumed.body.version, idempotencyKey: '633de8e7-4dba-4877-89e6-4e04d71bf087' }).expect(201);
    expect((await ticketPush).id).toBe(placed.body.id);
    expect((await walletPush).payload.availableMinorUnits).toBe(before.body.availableMinorUnits - resumed.body.stake.minorUnits);
    expect((await notificationPush).payload.body).toContain(placed.body.code);
    await request(app.getHttpServer()).get(`/api/tickets/${user}/code/${placed.body.code}`).set(auth).expect(200).expect(({ body }) => expect(body.id).toBe(placed.body.id));
  });
});
