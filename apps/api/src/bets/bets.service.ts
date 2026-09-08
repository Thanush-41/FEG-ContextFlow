import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PlaceDemoBetSchema, type DemoTicket, type PlaceDemoBet } from '@feg/contracts';
import { randomUUID } from 'node:crypto';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { DEMO_TICKET_MODEL } from '../persistence/models.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';

type StoredTicket = DemoTicket & { idempotencyKey: string };

@Injectable()
export class BetsService {
  private readonly tickets: DemoTicket[] = [];
  private readonly byKey = new Map<string, DemoTicket>();

  constructor(
    @Optional() @InjectModel(DEMO_TICKET_MODEL) private readonly ticketModel?: Model<StoredTicket>,
    @Optional() @Inject(RealtimeGateway) private readonly realtime?: RealtimeGateway,
  ) {}

  async list() {
    if (!this.ticketModel) return this.tickets;
    const documents = await this.ticketModel.find().sort({ placedAt: -1 }).lean().exec();
    return documents.map(this.clean);
  }

  async get(ticketId: string) {
    const document = this.ticketModel ? await this.ticketModel.findOne({ id: ticketId }).lean().exec() : null;
    const ticket = document ? this.clean(document) : this.tickets.find(candidate => candidate.id === ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found.');
    return ticket;
  }

  async place(candidate: PlaceDemoBet) {
    const parsed = PlaceDemoBetSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid demo bet.');
    const persisted = this.ticketModel ? await this.ticketModel.findOne({ idempotencyKey: parsed.data.idempotencyKey }).lean().exec() : null;
    const existing = persisted ? this.clean(persisted) : this.byKey.get(parsed.data.idempotencyKey);
    if (existing) return existing;
    const multiplier = parsed.data.selections.reduce((total, item) => total * item.acceptedOdds, 1);
    const ticket: DemoTicket = {
      id: `ticket-${randomUUID()}`,
      status: 'open', placedAt: new Date().toISOString(), selections: parsed.data.selections,
      stake: parsed.data.stake,
      potentialReturn: { currency: 'DCO', minorUnits: Math.round(parsed.data.stake.minorUnits * multiplier) },
    };
    if (this.ticketModel) await this.ticketModel.create({ ...ticket, idempotencyKey: parsed.data.idempotencyKey });
    this.tickets.unshift(ticket);
    this.byKey.set(parsed.data.idempotencyKey, ticket);
    this.realtime?.publishTicket(ticket);
    return ticket;
  }

  private clean(document: unknown): DemoTicket {
    const { _id: _discarded, idempotencyKey: _privateKey, ...ticket } = document as StoredTicket & { _id?: unknown };
    return ticket;
  }
}
