import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller.js';
import { BetsController } from '../src/bets/bets.controller.js';
import { BetsService } from '../src/bets/bets.service.js';
import { SportsController } from '../src/sports/sports.controller.js';
import { SportsService } from '../src/sports/sports.service.js';

describe('HealthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController, SportsController, BetsController],
      providers: [SportsService, BetsService],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  it('reports the API as healthy', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          service: 'feg-contextflow-api',
          version: '0.1.0',
        });
      });
  });

  it('serves offer and live event feeds', async () => {
    const offer = await request(app.getHttpServer()).get('/api/sports/events').expect(200);
    expect(offer.body).toHaveLength(2);
    const live = await request(app.getHttpServer()).get('/api/sports/events?status=live').expect(200);
    expect(live.body).toHaveLength(1);
    expect(live.body[0].score).toBe('1–1');
  });

  it('places demo bets idempotently and returns the ticket', async () => {
    const payload = {
      idempotencyKey: '604d26d4-9329-45e1-a112-fac74561c39a',
      stake: { currency: 'DCO', minorUnits: 100 },
      selections: [{
        eventId: 'event-chelsea-liverpool',
        marketId: 'market-match-result-01',
        selectionId: 'selection-home-01',
        acceptedOdds: 2.25,
      }],
    };
    const first = await request(app.getHttpServer()).post('/api/bets').send(payload).expect(201);
    const repeated = await request(app.getHttpServer()).post('/api/bets').send(payload).expect(201);
    expect(repeated.body.id).toBe(first.body.id);
    expect(first.body.potentialReturn.minorUnits).toBe(225);
  });
});
