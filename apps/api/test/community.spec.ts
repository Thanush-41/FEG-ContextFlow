import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { jest } from '@jest/globals';
import { CommunityController } from '../src/community/community.controller.js';
import { CommunityService } from '../src/community/community.service.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';
import { SlipsService } from '../src/slips/slips.service.js';

describe('Sprint 14 community feed', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer community-user-0001' };
  const slip = { id: 'slip-community-user-0001-1', ownerId: 'community-user-0001', tab: 1, version: 0, mode: 'accumulator', stake: { currency: 'DCO', minorUnits: 100 }, selections: [], totals: null, warnings: [], updatedAt: '2026-09-09T00:00:00.000Z' };
  const slips = { get: jest.fn(async () => slip), add: jest.fn(async (_owner: string, _tab: number, input: { selectionId: string; expectedVersion: number }) => ({ ...slip, version: input.expectedVersion + 1, selections: [{ selectionId: input.selectionId }] })) };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [CommunityController], providers: [CommunityService, DemoAuthGuard, { provide: SlipsService, useValue: slips }] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it('serves three posts and toggles an owner-specific reaction', async () => {
    const guest = await request(app.getHttpServer()).get('/api/community/feed').expect(200);
    expect(guest.body).toHaveLength(3); expect(guest.body[0]).toMatchObject({ reactedByMe: false, demoOnly: true });
    await request(app.getHttpServer()).post('/api/community/posts/community-live-derby/reaction').expect(401);
    const liked = await request(app.getHttpServer()).post('/api/community/posts/community-live-derby/reaction').set(auth).send({}).expect(201);
    expect(liked.body).toMatchObject({ reactedByMe: true, reactionCount: 19 });
    const unliked = await request(app.getHttpServer()).post('/api/community/posts/community-live-derby/reaction').set(auth).send({}).expect(201);
    expect(unliked.body).toMatchObject({ reactedByMe: false, reactionCount: 18 });
  });

  it('copies the shared selections through the authoritative slip service', async () => {
    const copied = await request(app.getHttpServer()).post('/api/community/posts/community-live-derby/copy').set(auth).send({ tab: 1, expectedVersion: 0 }).expect(201);
    expect(slips.add).toHaveBeenCalledTimes(2); expect(copied.body.slip.version).toBe(2);
    await request(app.getHttpServer()).post('/api/community/posts/community-casino-tour/copy').set(auth).send({ tab: 1, expectedVersion: 0 }).expect(400);
  });
});
