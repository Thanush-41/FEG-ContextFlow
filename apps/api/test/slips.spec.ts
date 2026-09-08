import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BetSlipSchema } from '@feg/contracts';
import { EventDetailService } from '../src/event-detail/event-detail.service.js';
import { SportsService } from '../src/sports/sports.service.js';
import { SlipsController } from '../src/slips/slips.controller.js';
import { SlipsService } from '../src/slips/slips.service.js';

describe('Sprint 7 versioned four-tab slips', () => {
  let app: INestApplication;
  const owner = 'guest-device-0001';
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [SlipsController], providers: [SportsService, EventDetailService, SlipsService] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it('creates independent tabs, replaces same-market picks, detects prices, and rejects stale writes', async () => {
    const base = `/api/slips/${owner}/tabs/1`;
    const empty = await request(app.getHttpServer()).get(base).expect(200);
    expect(BetSlipSchema.safeParse(empty.body).success).toBe(true);
    const changed = await request(app.getHttpServer()).post(`${base}/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.6, expectedVersion: 0 }).expect(201);
    expect(changed.body.warnings[0].code).toBe('ODDS_CHANGED');
    const accepted = await request(app.getHttpServer()).patch(base).send({ expectedVersion: 1, acceptOddsChanges: true }).expect(200);
    expect(accepted.body.warnings).toEqual([]);
    const replacement = await request(app.getHttpServer()).post(`${base}/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-1', acceptedOdds: 1.96, expectedVersion: 2 }).expect(201);
    expect(replacement.body.selections).toHaveLength(1);
    expect(replacement.body.selections[0].selectionId).toContain('outcome-0-1');
    const duplicate = await request(app.getHttpServer()).post(`${base}/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-1', acceptedOdds: 1.96, expectedVersion: 3 }).expect(201);
    expect(duplicate.body.version).toBe(3);
    await request(app.getHttpServer()).patch(base).send({ expectedVersion: 2, stakeMinorUnits: 500 }).expect(409);
    const tab2 = await request(app.getHttpServer()).get(`/api/slips/${owner}/tabs/2`).expect(200);
    expect(tab2.body.selections).toEqual([]); expect(tab2.body.version).toBe(0);
  });

  it('calculates accumulator/system totals and exposes recoverable suspension and clear states', async () => {
    const base = `/api/slips/${owner}/tabs/3`;
    const first = await request(app.getHttpServer()).post(`${base}/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.55, expectedVersion: 0 }).expect(201);
    const second = await request(app.getHttpServer()).post(`${base}/selections`).send({ eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-1', selectionId: 'event-chelsea-liverpool-outcome-1-0', acceptedOdds: 1.72, expectedVersion: first.body.version }).expect(201);
    const system = await request(app.getHttpServer()).patch(base).send({ expectedVersion: second.body.version, mode: 'system', systemSize: 1, stakeMinorUnits: 300 }).expect(200);
    expect(system.body.totals.lines).toBe(2); expect(system.body.totals.stakeMinorUnits).toBe(300);
    const cleared = await request(app.getHttpServer()).delete(base).send({ expectedVersion: system.body.version }).expect(200);
    expect(cleared.body.selections).toEqual([]); expect(cleared.body.totals).toBeNull();

    const suspendedBase = `/api/slips/${owner}/tabs/4`;
    const suspended = await request(app.getHttpServer()).post(`${suspendedBase}/selections`).send({ eventId: 'event-tennis-suspended', marketId: 'event-tennis-suspended-market-0', selectionId: 'event-tennis-suspended-outcome-0-0', acceptedOdds: 1.55, expectedVersion: 0 }).expect(201);
    expect(suspended.body.warnings[0].code).toBe('SELECTION_SUSPENDED');
    expect(suspended.body.totals).toBeNull();
  });
});
