import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EventDetailService } from '../src/event-detail/event-detail.service.js';
import { LiveAdminGuard } from '../src/live/live-admin.guard.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';
import { SlipsController } from '../src/slips/slips.controller.js';
import { SlipsService } from '../src/slips/slips.service.js';
import { SportsService } from '../src/sports/sports.service.js';
import { TicketAdminController } from '../src/tickets/ticket-admin.controller.js';
import { TicketPlacementController } from '../src/tickets/ticket-placement.controller.js';
import { TicketPlacementService } from '../src/tickets/ticket-placement.service.js';
import { WalletController } from '../src/wallet/wallet.controller.js';
import { WalletService } from '../src/wallet/wallet.service.js';

describe('Sprint 10 ticket lifecycle', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SlipsController, WalletController, TicketPlacementController, TicketAdminController],
      providers: [SportsService, EventDetailService, SlipsService, WalletService, TicketPlacementService, DemoAuthGuard, LiveAdminGuard],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });
  afterAll(() => app.close());

  async function place(ownerId: string, key: string) {
    const auth = { Authorization: `Bearer ${ownerId}` };
    const slip = await request(app.getHttpServer()).post(`/api/slips/${ownerId}/tabs/1/selections`).send({
      eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0',
      selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.55, expectedVersion: 0,
    }).expect(201);
    return request(app.getHttpServer()).post('/api/tickets/place').set(auth).send({ ownerId, tab: 1, expectedVersion: slip.body.version, idempotencyKey: key }).expect(201);
  }

  it('quotes and executes an idempotent demo cash-out with one wallet credit', async () => {
    const owner = 'cashout-user-0001';
    const auth = { Authorization: `Bearer ${owner}` };
    const ticket = await place(owner, '00000000-0000-4000-8000-000000000101');
    const before = await request(app.getHttpServer()).get(`/api/wallets/${owner}`).set(auth).expect(200);
    const copied = await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/copy`).set(auth).send({ tab: 2, expectedVersion: 0 }).expect(201);
    expect(copied.body).toMatchObject({ unavailableSelectionIds: [], repricedSelectionIds: [] });
    expect(copied.body.slip.selections).toHaveLength(1);
    await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/copy`).set(auth).send({ tab: 2, expectedVersion: 0 }).expect(409);
    await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/cashout/quote`).set({ Authorization: 'Bearer wrong-user-0001' }).send({}).expect(401);
    const quote = await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/cashout/quote`).set(auth).send({}).expect(201);
    expect(quote.body.amount.minorUnits).toBeGreaterThan(ticket.body.stake.minorUnits);
    const command = { quoteId: quote.body.id, idempotencyKey: '00000000-0000-4000-8000-000000000102' };
    const resolved = await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/cashout`).set(auth).send(command).expect(201);
    expect(resolved.body).toMatchObject({ status: 'cashed_out', resolution: 'cashout', payout: quote.body.amount });
    const after = await request(app.getHttpServer()).get(`/api/wallets/${owner}`).set(auth).expect(200);
    expect(after.body.availableMinorUnits - before.body.availableMinorUnits).toBe(quote.body.amount.minorUnits);
    const retry = await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/cashout`).set(auth).send(command).expect(201);
    expect(retry.body.id).toBe(resolved.body.id);
    const filtered = await request(app.getHttpServer()).get(`/api/tickets/${owner}?status=cashed_out`).set(auth).expect(200);
    expect(filtered.body.map((item: { id: string }) => item.id)).toContain(ticket.body.id);
    const ledger = await request(app.getHttpServer()).get(`/api/wallets/${owner}/ledger`).set(auth).expect(200);
    expect(ledger.body.filter((entry: { type: string }) => entry.type === 'cashout_credit')).toHaveLength(1);
  });

  it.each([
    ['won', 155],
    ['lost', 0],
    ['void', 100],
  ] as const)('settles %s tickets once and reconciles the wallet payout', async (result, expectedPayout) => {
    const suffix = result === 'won' ? '201' : result === 'lost' ? '301' : '401';
    const owner = `settle-${result}-user`;
    const auth = { Authorization: `Bearer ${owner}` };
    const ticket = await place(owner, `00000000-0000-4000-8000-000000000${suffix}`);
    const before = await request(app.getHttpServer()).get(`/api/wallets/${owner}`).set(auth).expect(200);
    const command = { result, idempotencyKey: `00000000-0000-4000-8000-000000000${Number(suffix) + 1}` };
    const settled = await request(app.getHttpServer()).post(`/api/admin/tickets/${ticket.body.id}/settle`).set('x-demo-admin-key', 'local-demo-admin-key').send(command).expect(201);
    expect(settled.body).toMatchObject({ status: result, resolution: result, payout: { currency: 'DCO', minorUnits: expectedPayout } });
    await request(app.getHttpServer()).post(`/api/admin/tickets/${ticket.body.id}/settle`).set('x-demo-admin-key', 'local-demo-admin-key').send(command).expect(201);
    const after = await request(app.getHttpServer()).get(`/api/wallets/${owner}`).set(auth).expect(200);
    expect(after.body.availableMinorUnits - before.body.availableMinorUnits).toBe(expectedPayout);
    await request(app.getHttpServer()).post(`/api/tickets/${owner}/${ticket.body.id}/cashout/quote`).set(auth).send({}).expect(409);
  });
});
