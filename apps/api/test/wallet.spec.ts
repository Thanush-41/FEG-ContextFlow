import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';
import { WalletController } from '../src/wallet/wallet.controller.js';
import { WalletService } from '../src/wallet/wallet.service.js';

describe('Sprint 8 authenticated demo wallet', () => {
  let app: INestApplication;
  const user = 'demo-wallet-user-001';
  const auth = { Authorization: `Bearer ${user}` };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [WalletController], providers: [WalletService, DemoAuthGuard] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it('requires authentication and creates balanced immutable-style ledger entries', async () => {
    await request(app.getHttpServer()).get(`/api/wallets/${user}`).expect(401);
    await request(app.getHttpServer()).get(`/api/wallets/${user}`).set({ Authorization: 'Bearer different-wallet-user' }).expect(401);
    const before = await request(app.getHttpServer()).get(`/api/wallets/${user}`).set(auth).expect(200);
    const payload = { amountMinorUnits: 2500, idempotencyKey: 'e84682aa-3f02-4a30-82d7-99be149bda6e' };
    const first = await request(app.getHttpServer()).post(`/api/wallets/${user}/deposit`).set(auth).send(payload).expect(201);
    const retry = await request(app.getHttpServer()).post(`/api/wallets/${user}/deposit`).set(auth).send(payload).expect(201);
    expect(first.body.wallet.availableMinorUnits).toBe(before.body.availableMinorUnits + 2500);
    expect(retry.body.entry.id).toBe(first.body.entry.id);
    expect(first.body.entry.postings.reduce((sum: number, posting: { amountMinorUnits: number }) => sum + posting.amountMinorUnits, 0)).toBe(0);
    await request(app.getHttpServer()).post(`/api/wallets/${user}/withdraw`).set(auth).send({ amountMinorUnits: 500, idempotencyKey: '12b8f6bc-f532-4267-bd31-d2f7ce9fd4db' }).expect(201);
    const ledger = await request(app.getHttpServer()).get(`/api/wallets/${user}/ledger`).set(auth).expect(200);
    expect(ledger.body).toHaveLength(2);
    expect(ledger.body.every((entry: { postings: { amountMinorUnits: number }[] }) => entry.postings.reduce((sum, posting) => sum + posting.amountMinorUnits, 0) === 0)).toBe(true);
  });

  it('rejects demo withdrawals beyond the available balance', async () => {
    await request(app.getHttpServer()).post(`/api/wallets/${user}/withdraw`).set(auth).send({ amountMinorUnits: 9_000_000, idempotencyKey: '6e83a1f0-8e96-44b6-8672-72ea7135b587' }).expect(400);
  });
});
