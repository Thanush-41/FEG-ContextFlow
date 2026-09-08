import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { ClientSession, Model } from 'mongoose';
import { LedgerEntrySchema, PublicIdSchema, WalletMutationSchema, WalletSchema, type LedgerEntry, type Wallet } from '@feg/contracts';
import { LEDGER_ENTRY_MODEL, WALLET_MODEL } from '../persistence/models.js';

type WalletResult = { wallet: Wallet; entry: LedgerEntry };

@Injectable()
export class WalletService {
  private readonly wallets = new Map<string, Wallet>();
  private readonly entries: LedgerEntry[] = [];
  constructor(
    @Optional() @InjectModel(WALLET_MODEL) private readonly walletModel?: Model<Wallet>,
    @Optional() @InjectModel(LEDGER_ENTRY_MODEL) private readonly ledgerModel?: Model<LedgerEntry>,
  ) {}

  async get(userId: string, session?: ClientSession): Promise<Wallet> {
    this.validateUser(userId);
    if (this.walletModel) {
      const query = this.walletModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: this.initial(userId) },
        { upsert: true, new: true, ...(session ? { session } : {}) },
      );
      const document = await query.lean().exec();
      return WalletSchema.parse(this.clean(document));
    }
    const existing = this.wallets.get(userId) ?? this.initial(userId);
    this.wallets.set(userId, existing);
    return existing;
  }

  async history(userId: string): Promise<LedgerEntry[]> {
    this.validateUser(userId);
    if (this.ledgerModel) return (await this.ledgerModel.find({ userId }).sort({ createdAt: -1 }).lean().exec()).map(document => LedgerEntrySchema.parse(this.clean(document)));
    return this.entries.filter(entry => entry.userId === userId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  deposit(userId: string, candidate: unknown) { return this.mutate(userId, candidate, 'demo_deposit', 1); }
  withdraw(userId: string, candidate: unknown) { return this.mutate(userId, candidate, 'demo_withdrawal', -1); }

  async debitForTicket(userId: string, amountMinorUnits: number, idempotencyKey: string, ticketId: string, session?: ClientSession): Promise<WalletResult> {
    return this.apply(userId, amountMinorUnits, idempotencyKey, 'bet_debit', -1, ticketId, session);
  }

  private async mutate(userId: string, candidate: unknown, type: 'demo_deposit' | 'demo_withdrawal', direction: 1 | -1): Promise<WalletResult> {
    const parsed = WalletMutationSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid wallet mutation.');
    if (this.walletModel && this.ledgerModel) {
      const session = await this.walletModel.db.startSession();
      let result: WalletResult | undefined;
      try { await session.withTransaction(async () => { result = await this.apply(userId, parsed.data.amountMinorUnits, parsed.data.idempotencyKey, type, direction, undefined, session); }); }
      finally { await session.endSession(); }
      if (!result) throw new BadRequestException('Wallet transaction failed.');
      return result;
    }
    return this.apply(userId, parsed.data.amountMinorUnits, parsed.data.idempotencyKey, type, direction);
  }

  private async apply(userId: string, amount: number, idempotencyKey: string, type: LedgerEntry['type'], direction: 1 | -1, ticketId?: string, session?: ClientSession): Promise<WalletResult> {
    this.validateUser(userId);
    const existing = this.ledgerModel ? await this.ledgerModel.findOne({ idempotencyKey }, null, session ? { session } : {}).lean().exec() : this.entries.find(entry => entry.idempotencyKey === idempotencyKey);
    if (existing) return { wallet: await this.get(userId, session), entry: LedgerEntrySchema.parse(this.clean(existing)) };
    const wallet = await this.get(userId, session);
    const nextBalance = wallet.availableMinorUnits + amount * direction;
    if (nextBalance < 0) throw new BadRequestException({ code: 'INSUFFICIENT_FUNDS', message: 'The demo wallet balance is too low.' });
    const updated: Wallet = { ...wallet, availableMinorUnits: nextBalance, updatedAt: new Date().toISOString() };
    const signed = amount * direction;
    const entry: LedgerEntry = { id: `ledger-${randomUUID()}`, userId, type, amountMinorUnits: signed, currency: 'DCO', balanceAfterMinorUnits: nextBalance, idempotencyKey, ...(ticketId ? { ticketId } : {}), postings: [{ account: 'wallet', amountMinorUnits: signed }, { account: 'demo_reserve', amountMinorUnits: -signed }], createdAt: new Date().toISOString() };
    if (this.walletModel && this.ledgerModel) {
      await this.walletModel.updateOne({ userId }, { $set: updated }, session ? { session } : {}).exec();
      await this.ledgerModel.create([entry], session ? { session } : {});
    } else { this.wallets.set(userId, updated); this.entries.unshift(entry); }
    return { wallet: updated, entry };
  }

  private initial(userId: string): Wallet { return { userId, currency: 'DCO', availableMinorUnits: 100_000, bonusMinorUnits: 10_000, updatedAt: new Date().toISOString() }; }
  private validateUser(userId: string) { if (!PublicIdSchema.safeParse(userId).success) throw new BadRequestException('Invalid wallet user.'); }
  private clean(document: unknown) { if (!document || typeof document !== 'object') return document; const { _id: _id, ...value } = document as Record<string, unknown>; return value; }
}
