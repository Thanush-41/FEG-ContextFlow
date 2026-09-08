import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import { DemoTicketSchema, PlaceSlipBetSchema, type DemoTicket } from '@feg/contracts';
import { DEMO_TICKET_MODEL } from '../persistence/models.js';
import { EventDetailService } from '../event-detail/event-detail.service.js';
import { SlipsService } from '../slips/slips.service.js';
import { WalletService } from '../wallet/wallet.service.js';

type StoredTicket = DemoTicket & { idempotencyKey: string };

@Injectable()
export class TicketPlacementService {
  private readonly memory = new Map<string, DemoTicket>();
  constructor(
    @Inject(SlipsService) private readonly slips: SlipsService,
    @Inject(EventDetailService) private readonly details: EventDetailService,
    @Inject(WalletService) private readonly wallets: WalletService,
    @Optional() @InjectModel(DEMO_TICKET_MODEL) private readonly ticketModel?: Model<StoredTicket>,
  ) {}

  async list(ownerId: string): Promise<DemoTicket[]> {
    if (this.ticketModel) {
      const documents = await this.ticketModel.find({ 'audit.actor': ownerId }).sort({ placedAt: -1 }).lean().exec();
      return documents.map(document => this.cleanTicket(document));
    }
    return [...this.memory.values()].filter(ticket => ticket.audit?.actor === ownerId).sort((left, right) => right.placedAt.localeCompare(left.placedAt));
  }

  async findByCode(ownerId: string, code: string): Promise<DemoTicket> {
    const document = this.ticketModel ? await this.ticketModel.findOne({ code, 'audit.actor': ownerId }).lean().exec() : null;
    const ticket = document ? this.cleanTicket(document) : [...this.memory.values()].find(candidate => candidate.code === code && candidate.audit?.actor === ownerId);
    if (!ticket) throw new NotFoundException('Ticket code not found.');
    return ticket;
  }

  async place(actor: string, candidate: unknown): Promise<DemoTicket> {
    const parsed = PlaceSlipBetSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid ticket placement.');
    if (actor !== parsed.data.ownerId) throw new UnauthorizedException('The authenticated demo user does not own this slip.');
    const existing = await this.findByKey(parsed.data.idempotencyKey);
    if (existing) return existing;
    const slip = await this.slips.get(parsed.data.ownerId, parsed.data.tab);
    if (slip.version !== parsed.data.expectedVersion) throw new ConflictException({ code: 'VERSION_CONFLICT', message: 'Review the latest slip before confirming.', currentVersion: slip.version });
    if (!slip.selections.length) throw new BadRequestException({ code: 'EMPTY_SLIP', message: 'Add a selection before confirming.' });
    if (slip.warnings.length) throw new BadRequestException({ code: 'SLIP_WARNINGS', message: 'Resolve all slip warnings before confirming.', warnings: slip.warnings });
    if (!slip.totals) throw new BadRequestException({ code: 'INVALID_TOTALS', message: 'The slip calculation could not be confirmed.' });
    await this.revalidate(slip.selections);
    const ticketId = `ticket-${randomUUID()}`;
    const code = `FEG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    let ticket: DemoTicket | undefined;
    const execute = async (session?: import('mongoose').ClientSession) => {
      const walletBefore = await this.wallets.get(actor, session);
      const debit = await this.wallets.debitForTicket(actor, slip.stake.minorUnits, parsed.data.idempotencyKey, ticketId, session);
      ticket = DemoTicketSchema.parse({
        id: ticketId, code, status: 'open', placedAt: new Date().toISOString(),
        selections: slip.selections.map(selection => ({ eventId: selection.eventId, marketId: selection.marketId, selectionId: selection.selectionId, acceptedOdds: selection.currentOdds })),
        stake: slip.stake, potentialReturn: { currency: 'DCO', minorUnits: slip.totals!.potentialReturnMinorUnits },
        calculation: slip.totals, walletBeforeMinorUnits: walletBefore.availableMinorUnits,
        walletAfterMinorUnits: debit.wallet.availableMinorUnits, placementSnapshot: slip.selections,
        audit: { actor, placedAt: new Date().toISOString(), idempotencyKey: parsed.data.idempotencyKey },
      });
      if (this.ticketModel) await this.ticketModel.create([{ ...ticket, idempotencyKey: parsed.data.idempotencyKey }], session ? { session } : {});
      else this.memory.set(parsed.data.idempotencyKey, ticket);
    };
    if (this.ticketModel) {
      const session = await this.ticketModel.db.startSession();
      try { await session.withTransaction(() => execute(session)); }
      finally { await session.endSession(); }
    } else await execute();
    if (!ticket) throw new BadRequestException('Ticket transaction failed.');
    await this.slips.clear(parsed.data.ownerId, parsed.data.tab, { expectedVersion: slip.version });
    return ticket;
  }

  private async revalidate(selections: import('@feg/contracts').SlipSelection[]) {
    for (const selection of selections) {
      const detail = await this.details.get(selection.eventId);
      const detailedMarket = detail.markets.find(market => market.id === selection.marketId || market.outcomes.some(outcome => outcome.id === selection.selectionId));
      const detailedOutcome = detailedMarket?.outcomes.find(outcome => outcome.id === selection.selectionId);
      const compactMarket = detail.event.markets.find(market => market.id === selection.marketId);
      const compactOutcome = compactMarket?.selections.find(outcome => outcome.id === selection.selectionId);
      const currentOdds = detailedOutcome?.odds ?? compactOutcome?.odds;
      const unavailable = detailedMarket ? detailedMarket.status !== 'open' || detailedOutcome?.state === 'locked' : compactOutcome?.state === 'locked' || compactOutcome?.state === 'disabled';
      if (!currentOdds || unavailable) throw new BadRequestException({ code: 'SELECTION_SUSPENDED', message: 'A selection is no longer available.', selectionId: selection.selectionId });
      if (currentOdds !== selection.currentOdds) throw new BadRequestException({ code: 'STALE_ODDS', message: 'A selection price changed before placement.', selectionId: selection.selectionId, currentOdds });
    }
  }

  private async findByKey(key: string): Promise<DemoTicket | undefined> {
    const document = this.ticketModel ? await this.ticketModel.findOne({ idempotencyKey: key }).lean().exec() : null;
    if (document) return this.cleanTicket(document);
    return this.memory.get(key);
  }

  private cleanTicket(document: unknown): DemoTicket {
    const { _id: _id, idempotencyKey: _key, ...ticket } = document as StoredTicket & { _id?: unknown };
    return DemoTicketSchema.parse(ticket);
  }
}
