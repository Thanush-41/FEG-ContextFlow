import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OfferResponseSchema, type SportsEvent } from '@feg/contracts';
import { OfferController } from '../src/offer/offer.controller.js';
import { OfferService } from '../src/offer/offer.service.js';
import { PskOfferProvider, type PskOfferPayload } from '../src/offer/psk-offer.provider.js';

const mappedEvent: SportsEvent = {
  id: 'ufo:mtch:test-001', sportId: 'ufo:sprt:00', leagueId: 'ufo:tour:test-001',
  sport: 'Football', league: 'Test League', startsAt: '2026-09-08T17:00:00.000Z',
  status: 'scheduled', home: 'Home FC', away: 'Away FC', totalMarketCount: 38,
  features: ['betBuilder', 'advantage'],
  markets: [{ id: 'ufo:mkt:test-001', name: 'Match result', features: [], selections: [
    { id: 'ufo:opt:test-home', label: '1', odds: 2.1, state: 'active', features: [] },
    { id: 'ufo:opt:test-draw', label: 'X', odds: 3.2, previousOdds: 3.1, state: 'changed', features: [] },
    { id: 'ufo:opt:test-away', label: '2', odds: 3.4, state: 'active', features: [] },
  ] }],
};

describe('Sprint 5 offer composition', () => {
  it('maps the observed PSK fixture, feature, market and outcome shapes', () => {
    const payload: PskOfferPayload = {
      tournaments: [{ id: 'ufo:tour:test-001', sportId: 'ufo:sprt:00', name: 'Test League' }],
      fixtures: [{
        id: 'ufo:mtch:test-001', sportId: 'ufo:sprt:00', tournamentId: 'ufo:tour:test-001',
        kind: 'PREMATCH', startDatetime: Date.now() + 20 * 60_000, totalMarketCount: 38,
        participants: [{ name: 'Home FC', type: 'HOME' }, { name: 'Away FC', type: 'AWAY' }],
        features: ['BETBUILDER', 'ADVANTAGE'],
      }],
      markets: [{
        id: 'ufo:mkt:test-001', fixtureId: 'ufo:mtch:test-001', name: 'Match result',
        outcomes: [
          { id: 'ufo:opt:test-away', name: '2', odds: 3.4, displayType: 'OPEN' },
          { id: 'ufo:opt:test-home', name: '1', odds: 2.1, displayType: 'OPEN' },
          { id: 'ufo:opt:test-draw', name: 'X', odds: 3.2, previousOdds: 3.1, displayType: 'OPEN' },
        ],
      }],
    };
    const [event] = new PskOfferProvider().map(payload, 'all');
    expect(event?.home).toBe('Home FC');
    expect(event?.features).toEqual(expect.arrayContaining(['betBuilder', 'advantage']));
    expect(event?.markets[0]?.selections.map(item => item.label)).toEqual(['1', 'X', '2']);
    expect(event?.markets[0]?.selections[1]?.state).toBe('changed');
  });

  describe('aggregated endpoint', () => {
    let app: INestApplication;
    beforeAll(async () => {
      const events = Array.from({ length: 120 }, (_, index) => ({
        ...mappedEvent, id: `ufo:mtch:test-${String(index).padStart(3, '0')}`,
      }));
      const moduleRef = await Test.createTestingModule({
        controllers: [OfferController],
        providers: [OfferService, { provide: PskOfferProvider, useValue: { load: async () => ({ events, sports: [{ id: 'ufo:sprt:00', name: 'Football' }] }) } }],
      }).compile();
      app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
    });
    afterAll(() => app.close());

    it('returns ordered sections, flags, cache metadata and a pagination cursor for 100 events', async () => {
      const started = performance.now();
      const response = await request(app.getHttpServer()).get('/api/offer?timeFilter=all&limit=100').expect(200);
      expect(performance.now() - started).toBeLessThan(300);
      expect(OfferResponseSchema.safeParse(response.body).success).toBe(true);
      expect(response.body.pagination).toEqual({ nextCursor: '100', total: 120 });
      expect(response.body.leagues[0].events).toHaveLength(100);
      expect(response.body.featured[0].features).toContain('betBuilder');
    });

    it('rejects unsupported filters and oversized pages', async () => {
      await request(app.getHttpServer()).get('/api/offer?timeFilter=week&limit=101').expect(400);
    });
  });
});
