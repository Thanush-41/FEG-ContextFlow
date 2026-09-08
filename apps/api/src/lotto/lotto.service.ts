import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import { CreateLottoEntrySchema, LottoDrawSchema, LottoEntrySchema, type LottoDraw, type LottoEntry } from '@feg/contracts';
import { LOTTO_ENTRY_MODEL } from '../persistence/models.js';

@Injectable()
export class LottoService {
  private readonly memory: LottoEntry[] = [];
  private readonly draws: LottoDraw[] = [
    LottoDrawSchema.parse({ id: 'lotto-draw-friday', title: 'Friday Five', drawAt: '2026-09-11T19:00:00.000Z', status: 'open', jackpotDcoMinorUnits: 250_000_000, winningNumbers: null, demoOnly: true }),
    LottoDrawSchema.parse({ id: 'lotto-draw-sunday', title: 'Sunday Five', drawAt: '2026-09-13T19:00:00.000Z', status: 'open', jackpotDcoMinorUnits: 400_000_000, winningNumbers: null, demoOnly: true }),
    LottoDrawSchema.parse({ id: 'lotto-draw-last', title: 'Tuesday Five', drawAt: '2026-09-08T19:00:00.000Z', status: 'drawn', jackpotDcoMinorUnits: 180_000_000, winningNumbers: [4, 11, 18, 23, 32], demoOnly: true }),
  ];
  constructor(@Optional() @InjectModel(LOTTO_ENTRY_MODEL) private readonly entryModel?: Model<LottoEntry>) {}
  listDraws() { return this.draws; }
  async listEntries(ownerId: string) {
    const stored = this.entryModel ? await this.entryModel.find({ ownerId }).sort({ createdAt: -1 }).lean().exec() : this.memory.filter(item => item.ownerId === ownerId);
    return stored.map(item => this.clean(item));
  }
  async create(ownerId: string, drawId: string, candidate: unknown): Promise<LottoEntry> {
    const parsed = CreateLottoEntrySchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Choose five unique numbers from 1 to 35.');
    const draw = this.draws.find(item => item.id === drawId);
    if (!draw || draw.status !== 'open') throw new BadRequestException('This demo draw is not open.');
    const existing = this.entryModel ? await this.entryModel.findOne({ ownerId, idempotencyKey: parsed.data.idempotencyKey }).lean().exec() : this.memory.find(item => item.ownerId === ownerId && item.idempotencyKey === parsed.data.idempotencyKey);
    if (existing) return this.clean(existing);
    const entry = LottoEntrySchema.parse({ id: `lotto-entry-${randomUUID()}`, ownerId, drawId, numbers: [...parsed.data.numbers].sort((a, b) => a - b), status: 'pending', createdAt: new Date().toISOString(), idempotencyKey: parsed.data.idempotencyKey, demoOnly: true });
    this.memory.unshift(entry); if (this.entryModel) await this.entryModel.create(entry); return entry;
  }
  private clean(candidate: unknown): LottoEntry { const { _id: _discarded, ...entry } = candidate as LottoEntry & { _id?: unknown }; return LottoEntrySchema.parse(entry); }
}
