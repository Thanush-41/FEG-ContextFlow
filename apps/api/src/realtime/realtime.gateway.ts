import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { DemoTicket, LiveEventSnapshot, LiveUpdateEnvelope, SportsEvent, Wallet } from '@feg/contracts';
import { Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { LiveSimulationService } from '../live/live-simulation.service.js';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: false } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;
  private unsubscribe?: () => void;
  private readonly subscriptionWindows = new Map<string, { startedAt: number; count: number }>();
  constructor(@Inject(LiveSimulationService) private readonly simulator: LiveSimulationService) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      const token = typeof socket.handshake.auth.token === 'string' ? socket.handshake.auth.token : socket.handshake.headers.authorization?.replace(/^Bearer /, '');
      if (!token || token.length < 8) return next(new Error('AUTH_REQUIRED'));
      socket.data.userId = token; next();
    });
  }

  onModuleInit() { this.unsubscribe = this.simulator.onUpdate((snapshot, channels) => channels.forEach(channel => this.publishLive(channel, snapshot))); }
  onModuleDestroy() { this.unsubscribe?.(); }

  handleConnection(client: Socket) {
    client.join(`user:${String(client.data.userId)}`);
    client.emit('system.ready', { version: 1, connectedAt: new Date().toISOString() });
  }

  handleDisconnect(_client: Socket) {
    this.subscriptionWindows.delete(_client.id);
  }

  @SubscribeMessage('events.subscribe')
  subscribe(client: Socket, input: { eventIds?: unknown }) {
    const now = Date.now(); const window = this.subscriptionWindows.get(client.id);
    const current = !window || now - window.startedAt >= 1_000 ? { startedAt: now, count: 1 } : { ...window, count: window.count + 1 };
    this.subscriptionWindows.set(client.id, current);
    if (current.count > 10) return { ok: false, code: 'RATE_LIMITED' };
    const eventIds = Array.isArray(input?.eventIds) ? input.eventIds.filter((id): id is string => typeof id === 'string').slice(0, 20) : [];
    for (const room of client.rooms) if (room.startsWith('event:')) client.leave(room);
    for (const eventId of eventIds) client.join(`event:${eventId}`);
    return { ok: true, snapshots: eventIds.map(eventId => this.simulator.get(eventId)).filter(Boolean) };
  }

  publishEvent(event: SportsEvent) {
    this.server?.to(`event:${event.id}`).emit('event.updated', event);
  }

  publishTicket(ticket: DemoTicket) {
    const owner = ticket.audit?.actor;
    if (owner) this.server?.to(`user:${owner}`).emit('ticket.created', ticket);
    else this.server?.emit('ticket.created', ticket);
  }

  publishWallet(wallet: Wallet) { this.server?.to(`user:${wallet.userId}`).emit('wallet.updated', this.envelope('wallet', wallet, 1)); }
  private publishLive(channel: 'event' | 'score' | 'market' | 'incident', snapshot: LiveEventSnapshot) { this.server?.to(`event:${snapshot.eventId}`).emit(`${channel}.updated`, this.envelope(channel, snapshot, snapshot.version, snapshot.eventId, snapshot.sequence)); }
  private envelope(channel: LiveUpdateEnvelope['channel'], payload: unknown, version: number, eventId?: string, sequence = 0): LiveUpdateEnvelope { return { channel, ...(eventId ? { eventId } : {}), sequence, version, emittedAt: new Date().toISOString(), payload }; }
}
