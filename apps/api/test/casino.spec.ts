import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CasinoController } from '../src/casino/casino.controller.js';
import { CasinoService } from '../src/casino/casino.service.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';

describe('Sprint 11 native demo casino API', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [CasinoController], providers: [CasinoService, DemoAuthGuard] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it('publishes exactly three clearly marked demo games', async () => {
    const response = await request(app.getHttpServer()).get('/api/casino').expect(200);
    expect(response.body.map((game: { type: string }) => game.type)).toEqual(['crash', 'dice', 'slots']);
    expect(response.body.every((game: { demoOnly: boolean }) => game.demoOnly)).toBe(true);
  });

  it.each([
    ['casino-crash-flight', 'multiplier'],
    ['casino-lucky-dice', 'dice'],
    ['casino-triple-slots', 'reels'],
  ])('plays %s idempotently with its game-specific result', async (gameId, field) => {
    const auth = { Authorization: 'Bearer casino-user-0001' };
    const command = { idempotencyKey: `00000000-0000-4000-8000-0000000000${field === 'multiplier' ? '11' : field === 'dice' ? '12' : '13'}` };
    const first = await request(app.getHttpServer()).post(`/api/casino/${gameId}/play`).set(auth).send(command).expect(201);
    const retry = await request(app.getHttpServer()).post(`/api/casino/${gameId}/play`).set(auth).send(command).expect(201);
    expect(first.body[field]).toBeDefined();
    expect(first.body).toEqual(retry.body);
    expect(first.body).toMatchObject({ ownerId: 'casino-user-0001', round: 1, demoOnly: true });
  });

  it('requires demo identity and rejects unknown games', async () => {
    await request(app.getHttpServer()).post('/api/casino/casino-crash-flight/play').send({}).expect(401);
    await request(app.getHttpServer()).post('/api/casino/not-a-real-game/play').set('authorization', 'Bearer casino-user-0001').send({ idempotencyKey: '00000000-0000-4000-8000-000000000099' }).expect(400);
  });
});
