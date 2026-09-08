import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DiscoveryController } from '../src/discovery/discovery.controller.js';
import { DiscoveryService } from '../src/discovery/discovery.service.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';

describe('Sprint 13 discovery and support', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer discovery-user-0001' };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [DiscoveryController], providers: [DiscoveryService, DemoAuthGuard] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it('serves three demo promotions and persists an idempotent owner opt-in', async () => {
    const initial = await request(app.getHttpServer()).get('/api/discovery/promotions').expect(200);
    expect(initial.body).toHaveLength(3); expect(initial.body[0]).toMatchObject({ eligible: false, optedIn: false, demoOnly: true });
    await request(app.getHttpServer()).post('/api/discovery/promotions/promo-live-boost/opt-in').expect(401);
    const opted = await request(app.getHttpServer()).post('/api/discovery/promotions/promo-live-boost/opt-in').set(auth).send({}).expect(201);
    expect(opted.body.optedIn).toBe(true);
    await request(app.getHttpServer()).post('/api/discovery/promotions/promo-live-boost/opt-in').set(auth).send({}).expect(201);
    const personalized = await request(app.getHttpServer()).get('/api/discovery/promotions').set(auth).expect(200);
    expect(personalized.body.find((item: { id: string }) => item.id === 'promo-live-boost').optedIn).toBe(true);
    await request(app.getHttpServer()).post('/api/discovery/promotions/missing/opt-in').set(auth).send({}).expect(400);
  });

  it('filters first-party news, guides, help and responsible-play content', async () => {
    const news = await request(app.getHttpServer()).get('/api/content?kind=news').expect(200);
    expect(news.body).toHaveLength(1); expect(news.body[0].kind).toBe('news');
    const help = await request(app.getHttpServer()).get('/api/content?kind=help').expect(200);
    expect(help.body).toHaveLength(2);
    await request(app.getHttpServer()).get(`/api/content/${help.body[0].id}`).expect(200);
    await request(app.getHttpServer()).get('/api/content?kind=unknown').expect(400);
    await request(app.getHttpServer()).get('/api/content/missing').expect(400);
  });
});
