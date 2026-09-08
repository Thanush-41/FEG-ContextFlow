import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { DemoTicket, SportsEvent } from '@feg/contracts';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: false } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('system.ready', { version: 1, connectedAt: new Date().toISOString() });
  }

  handleDisconnect(_client: Socket) {
    // Connection metrics are added with the observability provider.
  }

  publishEvent(event: SportsEvent) {
    this.server?.emit('event.updated', event);
  }

  publishTicket(ticket: DemoTicket) {
    this.server?.emit('ticket.created', ticket);
  }
}
