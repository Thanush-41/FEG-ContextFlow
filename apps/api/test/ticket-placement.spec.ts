import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';
import request from 'supertest';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';
import { EventDetailService } from '../src/event-detail/event-detail.service.js';
import { SlipsController } from '../src/slips/slips.controller.js';
import { SlipsService } from '../src/slips/slips.service.js';
import { SportsService } from '../src/sports/sports.service.js';
import { TicketPlacementController } from '../src/tickets/ticket-placement.controller.js';
import { TicketPlacementService } from '../src/tickets/ticket-placement.service.js';
import { WalletController } from '../src/wallet/wallet.controller.js';
import { WalletService } from '../src/wallet/wallet.service.js';

describe('Sprint 8 atomic ticket placement', () => {
  let app: INestApplication;
  let details: EventDetailService;
  const user = 'ticket-user-0001';
  const auth = { Authorization: `Bearer ${user}` };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [SlipsController, WalletController, TicketPlacementController], providers: [SportsService, EventDetailService, SlipsService, WalletService, TicketPlacementService, DemoAuthGuard] }).compile();
    details = moduleRef.get(EventDetailService);
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  const add = (tab: number, expectedVersion: number, marketIndex: number) => request(app.getHttpServer()).post(`/api/slips/${user}/tabs/${tab}/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: `event-chelsea-liverpool-market-${marketIndex}`, selectionId: `event-chelsea-liverpool-outcome-${marketIndex}-0`, acceptedOdds: marketIndex ? 1.72 : 1.55, expectedVersion });

  it('debits once, preserves the snapshot/breakdown, clears the slip, and returns an idempotent searchable receipt', async () => {
    const first = await add(1, 0, 0).expect(201);
    const second = await add(1, first.body.version, 1).expect(201);
    const before = await request(app.getHttpServer()).get(`/api/wallets/${user}`).set(auth).expect(200);
    const command = { ownerId: user, tab: 1, expectedVersion: second.body.version, idempotencyKey: '292c94cf-ae1c-449e-9864-6baad8084bdb' };
    const ticket = await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send(command).expect(201);
    const retry = await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send(command).expect(201);
    const after = await request(app.getHttpServer()).get(`/api/wallets/${user}`).set(auth).expect(200);
    expect(retry.body.id).toBe(ticket.body.id);
    expect(ticket.body.code).toMatch(/^FEG-/);
    expect(ticket.body.placementSnapshot).toHaveLength(2);
    expect(ticket.body.calculation.potentialReturnMinorUnits).toBe(ticket.body.potentialReturn.minorUnits);
    expect(ticket.body.walletBeforeMinorUnits - ticket.body.walletAfterMinorUnits).toBe(ticket.body.stake.minorUnits);
    expect(after.body.availableMinorUnits).toBe(before.body.availableMinorUnits - ticket.body.stake.minorUnits);
    const tickets = await request(app.getHttpServer()).get(`/api/tickets/${user}`).set(auth).expect(200);
    expect(tickets.body[0].code).toBe(ticket.body.code);
    await request(app.getHttpServer()).get(`/api/tickets/${user}/code/${ticket.body.code}`).set(auth).expect(200).expect(({ body }) => expect(body.id).toBe(ticket.body.id));
    await request(app.getHttpServer()).get(`/api/tickets/${user}`).set({ Authorization: 'Bearer another-user-0001' }).expect(401);
    const cleared = await request(app.getHttpServer()).get(`/api/slips/${user}/tabs/1`).expect(200);
    expect(cleared.body.selections).toEqual([]);
  });

  it('rejects unauthenticated, wrong-owner, stale-version, and suspended slips', async () => {
    await request(app.getHttpServer()).post('/api/tickets/place').send({}).expect(401);
    const slip = await add(2, 0, 0).expect(201);
    await request(app.getHttpServer()).post('/api/tickets/place').set({ Authorization: 'Bearer another-user-0001' }).send({ ownerId: user, tab: 2, expectedVersion: slip.body.version, idempotencyKey: '5663cc9d-a2ae-49fd-a1be-0ee4cb3b4a40' }).expect(401);
    await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send({ ownerId: user, tab: 2, expectedVersion: 0, idempotencyKey: '180cc1e7-c5ac-4ed2-83da-f9228576377f' }).expect(409);
    const suspended = await request(app.getHttpServer()).post(`/api/slips/${user}/tabs/4/selections`).send({ eventId: 'event-tennis-suspended', marketId: 'event-tennis-suspended-market-0', selectionId: 'event-tennis-suspended-outcome-0-0', acceptedOdds: 1.55, expectedVersion: 0 }).expect(201);
    await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send({ ownerId: user, tab: 4, expectedVersion: suspended.body.version, idempotencyKey: '2d33ef53-00c8-4598-b5ed-2ec7b73614cc' }).expect(400).expect(({ body }) => expect(body).toMatchObject({ code: 'SLIP_WARNINGS' }));
  });

  it('revalidates current odds immediately before placement', async () => {
    const slip = await add(3, 0, 0).expect(201);
    const originalGet = details.get.bind(details);
    const current = await originalGet('event-chelsea-liverpool');
    const changed = structuredClone(current);
    const selected = slip.body.selections[0] as { marketId: string; selectionId: string };
    const outcome = changed.markets.find(market => market.id === selected.marketId)?.outcomes.find(candidate => candidate.id === selected.selectionId);
    if (!outcome) throw new Error('Expected fixture outcome.');
    outcome.odds += 0.25;
    jest.spyOn(details, 'get').mockResolvedValueOnce(changed);
    await request(app.getHttpServer()).post('/api/tickets/place').set(auth).send({ ownerId: user, tab: 3, expectedVersion: slip.body.version, idempotencyKey: '38e92752-8db6-4220-b263-12928cbdbce2' }).expect(400).expect(({ body }) => expect(body).toMatchObject({ code: 'STALE_ODDS' }));
  });

  it('rejects insufficient funds without creating a debit or ticket', async () => {
    const poorUser = 'ticket-poor-user-001';
    const poorAuth = { Authorization: `Bearer ${poorUser}` };
    await request(app.getHttpServer()).post(`/api/wallets/${poorUser}/withdraw`).set(poorAuth).send({ amountMinorUnits: 99_950, idempotencyKey: 'c8a88562-b581-4ea9-a91b-00c090855af2' }).expect(201);
    const slip = await request(app.getHttpServer()).post(`/api/slips/${poorUser}/tabs/1/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.55, expectedVersion: 0 }).expect(201);
    await request(app.getHttpServer()).post('/api/tickets/place').set(poorAuth).send({ ownerId: poorUser, tab: 1, expectedVersion: slip.body.version, idempotencyKey: 'ffbf133d-2182-4a03-9da6-58bb51934626' }).expect(400).expect(({ body }) => expect(body).toMatchObject({ code: 'INSUFFICIENT_FUNDS' }));
    const after = await request(app.getHttpServer()).get(`/api/wallets/${poorUser}`).set(poorAuth).expect(200);
    const ledger = await request(app.getHttpServer()).get(`/api/wallets/${poorUser}/ledger`).set(poorAuth).expect(200);
    expect(after.body.availableMinorUnits).toBe(50);
    expect(ledger.body).toHaveLength(1);
  });
});
