import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { VirtualsController } from '../src/virtuals/virtuals.controller.js';
import { VirtualsService } from '../src/virtuals/virtuals.service.js';
import { SportsService } from '../src/sports/sports.service.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';

describe('Sprint 16 virtual games and results', () => {
  let app: INestApplication; const auth = { Authorization: 'Bearer virtual-user-0001' }; const key = '123e4567-e89b-42d3-a456-426614174101';
  const sports = { list: async () => [{ id: 'finished-game', sport: 'Basketball', league: 'Demo League', startsAt: '2026-09-08T18:00:00.000Z', status: 'finished', score: '88–82', home: 'City Hoops', away: 'United Five', features: [], markets: [] }] };
  beforeAll(async () => { const moduleRef = await Test.createTestingModule({ controllers: [VirtualsController], providers: [VirtualsService, DemoAuthGuard, { provide: SportsService, useValue: sports }] }).compile(); app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init(); });
  afterAll(() => app.close());
  it('serves three scheduled sports and deterministic idempotent simulation results', async () => {
    const schedule = await request(app.getHttpServer()).get('/api/virtuals/events').expect(200); expect(schedule.body.map((item: { sport: string }) => item.sport)).toEqual(['football', 'basketball', 'racing']);
    await request(app.getHttpServer()).post('/api/virtuals/events/virtual-football-01/play').send({ idempotencyKey: key }).expect(401);
    const first = await request(app.getHttpServer()).post('/api/virtuals/events/virtual-football-01/play').set(auth).send({ idempotencyKey: key }).expect(201);
    const retry = await request(app.getHttpServer()).post('/api/virtuals/events/virtual-football-01/play').set(auth).send({ idempotencyKey: key }).expect(201);
    expect(retry.body.id).toBe(first.body.id); expect(first.body).toMatchObject({ sport: 'football', round: 1, demoOnly: true });
  });
  it('combines finished fixtures, virtual history and owner-specific table favorites', async () => {
    const initial = await request(app.getHttpServer()).get('/api/results').set(auth).expect(200); expect(initial.body.fixtures).toHaveLength(1); expect(initial.body.virtual).toHaveLength(1); expect(initial.body.tables[0].favorite).toBe(false);
    const favorite = await request(app.getHttpServer()).post('/api/results/competitions/competition-demo-league/favorite').set(auth).send({}).expect(201); expect(favorite.body.favorite).toBe(true);
    const personalized = await request(app.getHttpServer()).get('/api/results').set(auth).expect(200); expect(personalized.body.tables[0].favorite).toBe(true);
    const guest = await request(app.getHttpServer()).get('/api/results').expect(200); expect(guest.body.tables[0].favorite).toBe(false);
    await request(app.getHttpServer()).post('/api/results/competitions/missing/favorite').set(auth).send({}).expect(400);
  });
});
