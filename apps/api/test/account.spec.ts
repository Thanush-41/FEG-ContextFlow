import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AccountController } from '../src/account/account.controller.js';
import { AccountService } from '../src/account/account.service.js';
import { DemoAuthGuard } from '../src/platform/demo-auth.guard.js';

describe('Sprint 12 demo account and settings', () => {
  let app: INestApplication;
  const owner = 'account-user-0001';
  const auth = { Authorization: `Bearer ${owner}` };
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [AccountController], providers: [AccountService, DemoAuthGuard] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.init();
  });
  afterAll(() => app.close());

  it('creates defaults and persists validated profile, privacy, notification and limit preferences', async () => {
    const initial = await request(app.getHttpServer()).get(`/api/account/${owner}/profile`).set(auth).expect(200);
    expect(initial.body).toMatchObject({ displayName: 'Demo Player', locale: 'en', notificationsEnabled: true, transcriptStorageEnabled: false });
    const updated = await request(app.getHttpServer()).patch(`/api/account/${owner}/profile`).set(auth).send({ displayName: 'Context Captain', locale: 'hr', notificationsEnabled: false, transcriptStorageEnabled: true, sessionReminderMinutes: 30, maxDemoStakeMinorUnits: 5000 }).expect(200);
    expect(updated.body).toMatchObject({ displayName: 'Context Captain', locale: 'hr', notificationsEnabled: false, transcriptStorageEnabled: true, sessionReminderMinutes: 30, maxDemoStakeMinorUnits: 5000 });
    await request(app.getHttpServer()).patch(`/api/account/${owner}/profile`).set(auth).send({ sessionReminderMinutes: 2 }).expect(400);
    await request(app.getHttpServer()).get(`/api/account/${owner}/profile`).set({ Authorization: 'Bearer account-user-0002' }).expect(401);
  });

  it('tracks the current device and permits revoking only another session', async () => {
    const first = await request(app.getHttpServer()).post(`/api/account/${owner}/sessions`).set(auth).send({ deviceName: 'iPhone 16' }).expect(201);
    const second = await request(app.getHttpServer()).post(`/api/account/${owner}/sessions`).set(auth).send({ deviceName: 'Android Emulator' }).expect(201);
    const repeated = await request(app.getHttpServer()).post(`/api/account/${owner}/sessions`).set(auth).send({ deviceName: 'Android Emulator' }).expect(201);
    expect(repeated.body.id).toBe(second.body.id);
    const sessions = await request(app.getHttpServer()).get(`/api/account/${owner}/sessions`).set(auth).expect(200);
    expect(sessions.body).toHaveLength(2);
    expect(sessions.body.find((item: { id: string }) => item.id === first.body.id).current).toBe(false);
    expect(sessions.body.find((item: { id: string }) => item.id === second.body.id).current).toBe(true);
    await request(app.getHttpServer()).delete(`/api/account/${owner}/sessions/${second.body.id}`).set(auth).expect(400);
    const revoked = await request(app.getHttpServer()).delete(`/api/account/${owner}/sessions/${first.body.id}`).set(auth).expect(200);
    expect(revoked.body.revokedAt).toBeDefined();
  });
});
