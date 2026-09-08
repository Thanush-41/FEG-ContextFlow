import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import { CashoutQuoteSchema, CashoutTicketSchema, CopyTicketSchema, CopyTicketResultSchema, DemoTicketSchema, PlaceSlipBetSchema, SettleTicketSchema, type CashoutQuote, type CopyTicketResult, type DemoTicket } from '@feg/contracts';
import { DEMO_TICKET_MODEL } from '../persistence/models.js';
import { EventDetailService } from '../event-detail/event-detail.service.js';
import { SlipsService } from '../slips/slips.service.js';
import { WalletService } from '../wallet/wallet.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';

type StoredTicket = DemoTicket & { idempotencyKey: string };

@Injectable()
export class TicketPlacementService {
  private readonly memory = new Map<string, DemoTicket>();
  private readonly quotes = new Map<string, CashoutQuote & { ownerId: string }>();
  constructor(
    @Inject(SlipsService) private readonly slips: SlipsService,
    @Inject(EventDetailService) private readonly details: EventDetailService,
    @Inject(WalletService) private readonly wallets: WalletService,
    @Optional() @InjectModel(DEMO_TICKET_MODEL) private readonly ticketModel?: Model<StoredTicket>,
    @Optional() @Inject(RealtimeGateway) private readonly realtime?: RealtimeGateway,
  ) {}

  async list(ownerId: string, status?: DemoTicket['status']): Promise<DemoTicket[]> {
    if (this.ticketModel) {
      const documents = await this.ticketModel.find({ 'audit.actor': ownerId, ...(status ? { status } : {}) }).sort({ placedAt: -1 }).lean().exec();
      return documents.map(document => this.cleanTicket(document));
    }
    return [...this.memory.values()].filter(ticket => ticket.audit?.actor === ownerId && (!status || ticket.status === status)).sort((left, right) => right.placedAt.localeCompare(left.placedAt));
  }

  async findByCode(ownerId: string, code: string): Promise<DemoTicket> {
    const document = this.ticketModel ? await this.ticketModel.findOne({ code, 'audit.actor': ownerId }).lean().exec() : null;
    const ticket = document ? this.cleanTicket(document) : [...this.memory.values()].find(candidate => candidate.code === code && candidate.audit?.actor === ownerId);
    if (!ticket) throw new NotFoundException('Ticket code not found.');
    return ticket;
  }

  async findById(ownerId: string, ticketId: string): Promise<DemoTicket> {
    const document = this.ticketModel ? await this.ticketModel.findOne({ id: ticketId, 'audit.actor': ownerId }).lean().exec() : null;
    const ticket = document ? this.cleanTicket(document) : [...this.memory.values()].find(candidate => candidate.id === ticketId && candidate.audit?.actor === ownerId);
    if (!ticket) throw new NotFoundException('Ticket not found.');
    return ticket;
  }

  async quoteCashout(ownerId: string, ticketId: string): Promise<CashoutQuote> {
    const ticket = await this.findById(ownerId, ticketId);
    if (ticket.status !== 'open') throw new ConflictException({ code: 'TICKET_NOT_OPEN', message: 'Only an open ticket can be cashed out.' });
    const profit = Math.max(0, ticket.potentialReturn.minorUnits - ticket.stake.minorUnits);
    const quote = CashoutQuoteSchema.parse({
      id: `quote-${randomUUID()}`, ticketId,
      amount: { currency: 'DCO', minorUnits: ticket.stake.minorUnits + Math.floor(profit * 0.6) },
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });
    this.quotes.set(quote.id, { ...quote, ownerId });
    return quote;
  }

  async cashout(ownerId: string, ticketId: string, candidate: unknown): Promise<DemoTicket> {
    const parsed = CashoutTicketSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid cash-out command.');
    const current = await this.findById(ownerId, ticketId);
    if (current.status === 'cashed_out' && current.resolutionAudit?.idempotencyKey === parsed.data.idempotencyKey) return current;
    if (current.status !== 'open') throw new ConflictException({ code: 'TICKET_ALREADY_RESOLVED', message: 'This ticket has already been resolved.' });
    const quote = this.quotes.get(parsed.data.quoteId);
    if (!quote || quote.ownerId !== ownerId || quote.ticketId !== ticketId) throw new BadRequestException({ code: 'INVALID_CASHOUT_QUOTE', message: 'Request a new cash-out quote.' });
    if (Date.parse(quote.expiresAt) <= Date.now()) { this.quotes.delete(quote.id); throw new ConflictException({ code: 'CASHOUT_QUOTE_EXPIRED', message: 'The cash-out quote expired.' }); }
    const ticket = await this.resolveTicket(ownerId, ticketId, 'cashed_out', quote.amount.minorUnits, parsed.data.idempotencyKey, 'cashout');
    this.quotes.delete(quote.id);
    return ticket;
  }

  async settle(ticketId: string, candidate: unknown): Promise<DemoTicket> {
    const parsed = SettleTicketSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid settlement command.');
    const ticket = await this.findAny(ticketId);
    const payout = parsed.data.result === 'won' ? ticket.potentialReturn.minorUnits : parsed.data.result === 'void' ? ticket.stake.minorUnits : 0;
    return this.resolveTicket(ticket.audit?.actor ?? '', ticketId, parsed.data.result, payout, parsed.data.idempotencyKey, parsed.data.result);
  }

  async copyToSlip(ownerId: string, ticketId: string, candidate: unknown): Promise<CopyTicketResult> {
    const parsed = CopyTicketSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid ticket copy command.');
    const ticket = await this.findById(ownerId, ticketId);
    let slip = await this.slips.get(ownerId, parsed.data.tab);
    if (slip.version !== parsed.data.expectedVersion) throw new ConflictException({ code: 'VERSION_CONFLICT', message: 'Review the current slip before copying.', currentVersion: slip.version });
    const unavailableSelectionIds: string[] = [];
    for (const selection of ticket.selections) {
      try {
        slip = await this.slips.add(ownerId, parsed.data.tab, { ...selection, expectedVersion: slip.version });
      } catch { unavailableSelectionIds.push(selection.selectionId); }
    }
    return CopyTicketResultSchema.parse({ slip, unavailableSelectionIds, repricedSelectionIds: slip.selections.filter(selection => selection.state === 'changed').map(selection => selection.selectionId) });
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
    this.realtime?.publishTicket(ticket);
    this.realtime?.publishWallet(await this.wallets.get(actor));
    this.realtime?.publishNotification(actor, { id: `notification-${ticket.id}`, title: 'Demo ticket confirmed', body: `${ticket.code ?? ticket.id} is now open.` });
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

  private async findAny(ticketId: string): Promise<DemoTicket> {
    const document = this.ticketModel ? await this.ticketModel.findOne({ id: ticketId }).lean().exec() : null;
    const ticket = document ? this.cleanTicket(document) : [...this.memory.values()].find(candidate => candidate.id === ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found.');
    return ticket;
  }

  private async resolveTicket(ownerId: string, ticketId: string, status: Exclude<DemoTicket['status'], 'open'>, payoutMinorUnits: number, idempotencyKey: string, resolution: NonNullable<DemoTicket['resolution']>): Promise<DemoTicket> {
    const current = await this.findById(ownerId, ticketId);
    if (current.status !== 'open') {
      if (current.status === status && current.resolutionAudit?.idempotencyKey === idempotencyKey) return current;
      throw new ConflictException({ code: 'TICKET_ALREADY_RESOLVED', message: 'This ticket has already been resolved.' });
    }
    const settledAt = new Date().toISOString();
    const updated = DemoTicketSchema.parse({ ...current, status, settledAt, payout: { currency: 'DCO', minorUnits: payoutMinorUnits }, resolution, resolutionAudit: { actor: ownerId, resolvedAt: settledAt, idempotencyKey } });
    const execute = async (session?: import('mongoose').ClientSession) => {
      if (payoutMinorUnits > 0) await this.wallets.creditForTicket(ownerId, payoutMinorUnits, idempotencyKey, ticketId, status === 'cashed_out' ? 'cashout_credit' : status === 'void' ? 'bet_refund' : 'bet_payout', session);
      if (this.ticketModel) {
        const result = await this.ticketModel.replaceOne({ id: ticketId, status: 'open' }, { ...updated, idempotencyKey: current.audit?.idempotencyKey }, session ? { session } : {}).exec();
        if (!result.modifiedCount) throw new ConflictException({ code: 'TICKET_ALREADY_RESOLVED', message: 'This ticket has already been resolved.' });
      } else {
        const key = [...this.memory.entries()].find(([, ticket]) => ticket.id === ticketId)?.[0];
        if (!key) throw new NotFoundException('Ticket not found.');
        this.memory.set(key, updated);
      }
    };
    if (this.ticketModel) {
      const session = await this.ticketModel.db.startSession();
      try { await session.withTransaction(() => execute(session)); }
      finally { await session.endSession(); }
    } else await execute();
    this.realtime?.publishTicket(updated, 'ticket.updated');
    if (payoutMinorUnits > 0) this.realtime?.publishWallet(await this.wallets.get(ownerId));
    this.realtime?.publishNotification(ownerId, { id: `notification-${ticketId}-${status}`, title: status === 'cashed_out' ? 'Demo cash-out complete' : 'Demo ticket settled', body: `${updated.code ?? updated.id} is ${status.replace('_', ' ')}.` });
    return updated;
  }

  private cleanTicket(document: unknown): DemoTicket {
    const { _id: _id, idempotencyKey: _key, ...ticket } = document as StoredTicket & { _id?: unknown };
    return DemoTicketSchema.parse(ticket);
  }
}
