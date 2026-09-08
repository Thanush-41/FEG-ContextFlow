import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlaceDemoBetSchema, type DemoTicket, type PlaceDemoBet } from '@feg/contracts';
import { randomUUID } from 'node:crypto';

@Injectable()
export class BetsService {
  private readonly tickets: DemoTicket[] = [];
  private readonly byKey = new Map<string, DemoTicket>();

  list() { return this.tickets; }

  get(ticketId: string) {
    const ticket = this.tickets.find(candidate => candidate.id === ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found.');
    return ticket;
  }

  place(candidate: PlaceDemoBet) {
    const parsed = PlaceDemoBetSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid demo bet.');
    const existing = this.byKey.get(parsed.data.idempotencyKey);
    if (existing) return existing;
    const multiplier = parsed.data.selections.reduce((total, item) => total * item.acceptedOdds, 1);
    const ticket: DemoTicket = {
      id: `ticket-${randomUUID()}`,
      status: 'open', placedAt: new Date().toISOString(), selections: parsed.data.selections,
      stake: parsed.data.stake,
      potentialReturn: { currency: 'DCO', minorUnits: Math.round(parsed.data.stake.minorUnits * multiplier) },
    };
    this.tickets.unshift(ticket);
    this.byKey.set(parsed.data.idempotencyKey, ticket);
    return ticket;
  }
}
