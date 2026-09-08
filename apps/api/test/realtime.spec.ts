import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { BetsController } from '../src/bets/bets.controller.js';
import { BetsService } from '../src/bets/bets.service.js';
import { RealtimeGateway } from '../src/realtime/realtime.gateway.js';

describe('ticket realtime delivery', () => {
  let app: INestApplication;
  let socket: Socket;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BetsController], providers: [BetsService, RealtimeGateway],
    }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as { port: number };
    socket = io(`http://127.0.0.1:${address.port}/realtime`, { transports: ['websocket'] });
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  });
  afterAll(async () => { socket.close(); await app.close(); });

  it('publishes the same ticket accepted by the idempotent HTTP command', async () => {
    const pushed = new Promise<{ id: string }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Realtime ticket timeout.')), 3_000);
      socket.once('ticket.created', ticket => { clearTimeout(timer); resolve(ticket); });
    });
    const response = await request(app.getHttpServer()).post('/api/bets').send({
      idempotencyKey: '5350cb5b-cd6e-4788-a3ca-66e6138805be',
      stake: { currency: 'DCO', minorUnits: 100 },
      selections: [{ eventId: 'event-realtime-001', marketId: 'market-realtime-001', selectionId: 'selection-realtime-001', acceptedOdds: 2 }],
    }).expect(201);
    expect((await pushed).id).toBe(response.body.id);
  });
});
