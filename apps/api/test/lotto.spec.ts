import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { LottoController } from '../src/lotto/lotto.controller.js';
import { LottoService } from '../src/lotto/lotto.service.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';

describe('Sprint 15 demo lotto', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer lotto-user-0001' };
  const key = '123e4567-e89b-42d3-a456-426614174001';
  beforeAll(async () => { const moduleRef = await Test.createTestingModule({ controllers: [LottoController], providers: [LottoService, DemoAuthGuard] }).compile(); app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init(); });
  afterAll(() => app.close());
  it('lists two open draws and one deterministic result', async () => {
    const response = await request(app.getHttpServer()).get('/api/lotto/draws').expect(200);
    expect(response.body).toHaveLength(3); expect(response.body.filter((draw: { status: string }) => draw.status === 'open')).toHaveLength(2);
    expect(response.body.find((draw: { status: string }) => draw.status === 'drawn').winningNumbers).toEqual([4, 11, 18, 23, 32]);
  });
  it('validates, saves and idempotently returns an owner entry without wallet activity', async () => {
    await request(app.getHttpServer()).get('/api/lotto/entries').expect(401);
    await request(app.getHttpServer()).post('/api/lotto/draws/lotto-draw-friday/entries').set(auth).send({ numbers: [3, 3, 14, 22, 31], idempotencyKey: key }).expect(400);
    const first = await request(app.getHttpServer()).post('/api/lotto/draws/lotto-draw-friday/entries').set(auth).send({ numbers: [31, 3, 14, 22, 9], idempotencyKey: key }).expect(201);
    const retry = await request(app.getHttpServer()).post('/api/lotto/draws/lotto-draw-friday/entries').set(auth).send({ numbers: [31, 3, 14, 22, 9], idempotencyKey: key }).expect(201);
    expect(retry.body.id).toBe(first.body.id); expect(first.body).toMatchObject({ numbers: [3, 9, 14, 22, 31], status: 'pending', demoOnly: true });
    const entries = await request(app.getHttpServer()).get('/api/lotto/entries').set(auth).expect(200); expect(entries.body).toHaveLength(1);
    await request(app.getHttpServer()).post('/api/lotto/draws/lotto-draw-last/entries').set(auth).send({ numbers: [1, 2, 3, 4, 5], idempotencyKey: '123e4567-e89b-42d3-a456-426614174002' }).expect(400);
  });
});
