import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BetBuilderValidationSchema, EventDetailResponseSchema } from '@feg/contracts';
import { EventDetailController } from '../src/event-detail/event-detail.controller.js';
import { EventDetailService } from '../src/event-detail/event-detail.service.js';
import { SportsService } from '../src/sports/sports.service.js';

describe('Sprint 6 event detail and BetBuilder', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventDetailController], providers: [SportsService, EventDetailService],
    }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it.each([
    ['event-chelsea-liverpool', 'scheduled', 'open', 'Match result'],
    ['event-dinamo-hajduk', 'live', 'open', 'Match result'],
    ['event-tennis-suspended', 'suspended', 'suspended', 'Match winner'],
    ['event-basketball-finished', 'finished', 'settled', 'Moneyline'],
    ['event-hockey-postponed', 'postponed', 'suspended', 'Match result'],
    ['event-generic-cancelled', 'cancelled', 'suspended', 'Winner'],
  ])('serves versioned sport detail for %s in the %s state', async (eventId, status, marketStatus, firstMarket) => {
    const response = await request(app.getHttpServer()).get(`/api/events/${eventId}/detail`).expect(200);
    expect(EventDetailResponseSchema.safeParse(response.body).success).toBe(true);
    expect(response.body.event.status).toBe(status);
    expect(response.body.markets.length).toBeGreaterThanOrEqual(5);
    expect(response.body.markets.length).toBeLessThanOrEqual(20);
    expect(response.body.markets[0].name).toBe(firstMarket);
    expect(response.body.markets[0].status).toBe(marketStatus);
    expect(response.body.lineups.home).toHaveLength(11);
  });

  it('includes live periods and a completed result', async () => {
    const live = await request(app.getHttpServer()).get('/api/events/event-dinamo-hajduk/detail').expect(200);
    const completed = await request(app.getHttpServer()).get('/api/events/event-basketball-finished/detail').expect(200);
    expect(live.body.periods).toEqual([{ name: 'Current', home: 1, away: 1 }]);
    expect(completed.body.result).toEqual({ home: 88, away: 82, winner: 'home' });
  });

  it('accepts compatible selections and rejects mutually exclusive outcomes with codes', async () => {
    const detail = await request(app.getHttpServer()).get('/api/events/event-chelsea-liverpool/detail').expect(200);
    const first = detail.body.markets[0].outcomes[0].id;
    const sameMarket = detail.body.markets[0].outcomes[1].id;
    const otherMarket = detail.body.markets[1].outcomes[0].id;
    const valid = await request(app.getHttpServer()).post('/api/events/event-chelsea-liverpool/betbuilder/validate').send({ selectionIds: [first, otherMarket] }).expect(201);
    const invalid = await request(app.getHttpServer()).post('/api/events/event-chelsea-liverpool/betbuilder/validate').send({ selectionIds: [first, sameMarket] }).expect(201);
    expect(BetBuilderValidationSchema.safeParse(valid.body).success).toBe(true);
    expect(valid.body.valid).toBe(true); expect(valid.body.combinedOdds).toBeGreaterThan(1);
    expect(invalid.body.valid).toBe(false); expect(invalid.body.reasons[0].code).toBe('MUTUALLY_EXCLUSIVE');
  });

  it('rejects suspended selections with a machine-readable availability reason', async () => {
    const detail = await request(app.getHttpServer()).get('/api/events/event-tennis-suspended/detail').expect(200);
    const selectionId = detail.body.markets[0].outcomes[0].id;
    const response = await request(app.getHttpServer()).post('/api/events/event-tennis-suspended/betbuilder/validate').send({ selectionIds: [selectionId] }).expect(201);
    expect(response.body.valid).toBe(false);
    expect(response.body.reasons[0].code).toBe('SELECTION_UNAVAILABLE');
  });
});
