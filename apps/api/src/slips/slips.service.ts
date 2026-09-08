import { BadRequestException, ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { calculateBet } from '@feg/bet-engine';
import {
  AddSlipSelectionSchema, BetSlipSchema, PublicIdSchema, UpdateSlipSchema,
  type BetSlip, type SlipSelection, type SlipWarning,
} from '@feg/contracts';
import { BET_SLIP_MODEL } from '../persistence/models.js';
import { EventDetailService } from '../event-detail/event-detail.service.js';

type StoredSlip = BetSlip & { key: string };

@Injectable()
export class SlipsService {
  private readonly memory = new Map<string, BetSlip>();
  constructor(
    @Inject(EventDetailService) private readonly details: EventDetailService,
    @Optional() @InjectModel(BET_SLIP_MODEL) private readonly slipModel?: Model<StoredSlip>,
  ) {}

  async get(ownerId: string, tab: number): Promise<BetSlip> {
    this.validateIdentity(ownerId, tab);
    const key = this.key(ownerId, tab);
    const stored = this.slipModel ? await this.slipModel.findOne({ key }).lean().exec() : null;
    if (stored) return this.clean(stored);
    const existing = this.memory.get(key);
    if (existing) return existing;
    const slip = this.empty(ownerId, tab);
    await this.save(slip);
    return slip;
  }

  async add(ownerId: string, tab: number, candidate: unknown): Promise<BetSlip> {
    const parsed = AddSlipSelectionSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid slip selection.');
    const slip = await this.get(ownerId, tab);
    this.checkVersion(slip, parsed.data.expectedVersion);
    if (slip.selections.some(selection => selection.selectionId === parsed.data.selectionId)) return slip;
    const incoming = await this.resolve(parsed.data.eventId, parsed.data.marketId, parsed.data.selectionId, parsed.data.acceptedOdds);
    const selections = slip.selections.filter(selection => selection.marketId !== incoming.marketId);
    const incompatible = selections.filter(selection => selection.eventId === incoming.eventId && selection.compatibilityGroup === incoming.compatibilityGroup);
    const next = this.reconcile({ ...slip, selections: incompatible.length ? selections : [...selections, incoming], version: slip.version + 1, updatedAt: new Date().toISOString() });
    if (incompatible.length) next.warnings.unshift({ code: 'INCOMPATIBLE_SELECTION', message: 'This selection cannot be combined with the existing same-event choice.', selectionIds: incompatible.map(item => item.selectionId), recoverable: true });
    await this.save(next);
    return next;
  }

  async remove(ownerId: string, tab: number, selectionId: string, candidate: unknown): Promise<BetSlip> {
    const parsed = UpdateSlipSchema.pick({ expectedVersion: true }).safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid slip version.');
    const slip = await this.get(ownerId, tab);
    this.checkVersion(slip, parsed.data.expectedVersion);
    return this.mutate(slip, { selections: slip.selections.filter(selection => selection.selectionId !== selectionId) });
  }

  async update(ownerId: string, tab: number, candidate: unknown): Promise<BetSlip> {
    const parsed = UpdateSlipSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid slip update.');
    const slip = await this.get(ownerId, tab);
    this.checkVersion(slip, parsed.data.expectedVersion);
    const selections = parsed.data.acceptOddsChanges ? slip.selections.map(selection => ({ ...selection, acceptedOdds: selection.currentOdds, state: selection.state === 'changed' ? 'active' as const : selection.state })) : slip.selections;
    return this.mutate(slip, {
      selections,
      ...(parsed.data.mode ? { mode: parsed.data.mode } : {}),
      ...(parsed.data.systemSize ? { systemSize: parsed.data.systemSize } : {}),
      ...(parsed.data.stakeMinorUnits !== undefined ? { stake: { currency: 'DCO' as const, minorUnits: parsed.data.stakeMinorUnits } } : {}),
    });
  }

  async clear(ownerId: string, tab: number, candidate: unknown): Promise<BetSlip> {
    const parsed = UpdateSlipSchema.pick({ expectedVersion: true }).safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid slip version.');
    const slip = await this.get(ownerId, tab);
    this.checkVersion(slip, parsed.data.expectedVersion);
    return this.mutate(slip, { selections: [] });
  }

  private async resolve(eventId: string, marketId: string, selectionId: string, acceptedOdds: number): Promise<SlipSelection> {
    const detail = await this.details.get(eventId);
    const market = detail.markets.find(item => item.id === marketId) ?? detail.markets.find(item => item.outcomes.some(outcome => outcome.id === selectionId));
    const outcome = market?.outcomes.find(item => item.id === selectionId);
    if (!market || !outcome) {
      const compact = detail.event.markets.find(item => item.id === marketId);
      const selection = compact?.selections.find(item => item.id === selectionId);
      if (!compact || !selection) throw new BadRequestException('Selection not found for this event.');
      return { eventId, marketId, selectionId, eventLabel: `${detail.event.home} · ${detail.event.away}`, marketLabel: compact.name, selectionLabel: selection.label, acceptedOdds, currentOdds: selection.odds, state: selection.state === 'locked' || selection.state === 'disabled' ? 'suspended' : acceptedOdds === selection.odds ? 'active' : 'changed' };
    }
    return { eventId, marketId: market.id, selectionId, eventLabel: `${detail.event.home} · ${detail.event.away}`, marketLabel: market.name, selectionLabel: outcome.label, acceptedOdds, currentOdds: outcome.odds, state: market.status !== 'open' || outcome.state === 'locked' ? 'suspended' : acceptedOdds === outcome.odds ? 'active' : 'changed', compatibilityGroup: outcome.compatibilityGroup };
  }

  private reconcile(slip: BetSlip): BetSlip {
    const warnings: SlipWarning[] = [];
    const changed = slip.selections.filter(selection => selection.state === 'changed').map(selection => selection.selectionId);
    const suspended = slip.selections.filter(selection => selection.state === 'suspended').map(selection => selection.selectionId);
    if (changed.length) warnings.push({ code: 'ODDS_CHANGED', message: 'One or more prices changed. Review and accept the new odds.', selectionIds: changed, recoverable: true });
    if (suspended.length) warnings.push({ code: 'SELECTION_SUSPENDED', message: 'A selection is suspended. Remove it or wait for reopening.', selectionIds: suspended, recoverable: true });
    if (slip.stake.minorUnits > 100_000) warnings.push({ code: 'STAKE_LIMIT', message: 'The demo stake limit is 1,000.00 DCO.', selectionIds: [], recoverable: true });
    const active = slip.selections.filter(selection => selection.state !== 'suspended');
    let totals: BetSlip['totals'] = null;
    if (active.length) {
      try { totals = calculateBet({ legs: active.map(selection => ({ odds: selection.currentOdds, status: selection.state === 'void' ? 'void' : 'active' })), stakeMinorUnits: slip.stake.minorUnits, mode: slip.mode, ...(slip.mode === 'system' && slip.systemSize ? { systemSize: slip.systemSize } : {}), boostPercent: active.length >= 3 ? 5 : 0, feeBasisPoints: 0, taxBasisPoints: 0 }); }
      catch { totals = null; }
    }
    return BetSlipSchema.parse({ ...slip, totals, warnings });
  }

  private async mutate(slip: BetSlip, update: Partial<BetSlip>) {
    const next = this.reconcile({ ...slip, ...update, version: slip.version + 1, updatedAt: new Date().toISOString() });
    await this.save(next);
    return next;
  }
  private async save(slip: BetSlip) {
    const key = this.key(slip.ownerId, slip.tab);
    this.memory.set(key, slip);
    if (this.slipModel) await this.slipModel.updateOne({ key }, { $set: { key, ...slip } }, { upsert: true }).exec();
  }
  private empty(ownerId: string, tab: number): BetSlip { return { id: `slip-${ownerId}-${tab}`, ownerId, tab, version: 0, mode: 'accumulator', stake: { currency: 'DCO', minorUnits: 100 }, selections: [], totals: null, warnings: [], updatedAt: new Date().toISOString() }; }
  private clean(document: unknown): BetSlip { const { _id: _id, key: _key, ...slip } = document as StoredSlip & { _id?: unknown }; return BetSlipSchema.parse(slip); }
  private checkVersion(slip: BetSlip, expected: number) { if (slip.version !== expected) throw new ConflictException({ code: 'VERSION_CONFLICT', message: 'The slip changed on another client.', currentVersion: slip.version }); }
  private validateIdentity(ownerId: string, tab: number) { if (!PublicIdSchema.safeParse(ownerId).success || !Number.isInteger(tab) || tab < 1 || tab > 4) throw new BadRequestException('Invalid slip owner or tab.'); }
  private key(ownerId: string, tab: number) { return `${ownerId}:${tab}`; }
}
