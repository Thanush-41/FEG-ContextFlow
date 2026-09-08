import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { OfferResponse, OfferTimeFilter, SportsEvent } from '@feg/contracts';
import { SPORTS_EVENT_MODEL } from '../persistence/models.js';
import { PskOfferProvider } from './psk-offer.provider.js';

type CachedOffer = { expiresAt: number; events: SportsEvent[]; sports: Array<{ id?: string; name?: string; icon?: string }> };

@Injectable()
export class OfferService {
  private readonly cache = new Map<OfferTimeFilter, CachedOffer>();

  constructor(
    @Inject(PskOfferProvider) private readonly provider: PskOfferProvider,
    @Optional() @InjectModel(SPORTS_EVENT_MODEL) private readonly eventModel?: Model<SportsEvent>,
  ) {}

  async get(filter: OfferTimeFilter, cursor: number, limit: number): Promise<OfferResponse> {
    const loaded = await this.load(filter);
    const page = loaded.events.slice(cursor, cursor + limit);
    const leagueMap = new Map<string, OfferResponse['leagues'][number]>();
    for (const event of page) {
      const id = event.leagueId ?? `league-${event.league.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const group = leagueMap.get(id) ?? { id, sportId: event.sportId ?? 'sport-football', name: event.league, pinned: false, events: [] };
      group.events.push(event); leagueMap.set(id, group);
    }
    const sportCounts = new Map<string, { id: string; name: string; icon?: string; eventCount: number }>();
    for (const event of loaded.events) {
      const id = event.sportId ?? 'sport-football';
      const source = loaded.sports.find(item => item.id === id);
      const current = sportCounts.get(id) ?? {
        id, name: source?.name ?? event.sport, eventCount: 0,
        ...(source?.icon ? { icon: source.icon } : {}),
      };
      current.eventCount += 1; sportCounts.set(id, current);
    }
    const next = cursor + page.length < loaded.events.length ? String(cursor + page.length) : null;
    return {
      timeFilter: filter,
      featured: loaded.events.filter(event => event.features.includes('betBuilder') || event.features.includes('boostedOdds')).slice(0, 5),
      sports: [...sportCounts.values()], leagues: [...leagueMap.values()],
      cache: { source: loaded.source, generatedAt: new Date().toISOString(), maxAgeSeconds: 30 },
      pagination: { nextCursor: next, total: loaded.events.length },
    };
  }

  private async load(filter: OfferTimeFilter): Promise<CachedOffer & { source: 'psk' | 'mongodb' | 'fixture' }> {
    const cached = this.cache.get(filter);
    if (cached && cached.expiresAt > Date.now()) return { ...cached, source: 'psk' };
    try {
      const live = await this.provider.load(filter);
      if (!live.events.length) throw new Error('Provider returned no usable events.');
      const entry = { ...live, expiresAt: Date.now() + 30_000 };
      this.cache.set(filter, entry);
      if (this.eventModel) await this.eventModel.bulkWrite(live.events.map(event => ({ updateOne: { filter: { id: event.id }, update: { $set: event }, upsert: true } })));
      return { ...entry, source: 'psk' };
    } catch {
      if (this.eventModel) {
        const docs = await this.eventModel.find(this.mongoFilter(filter)).sort({ startsAt: 1 }).limit(100).lean().exec();
        if (docs.length) return { events: docs.map(this.clean), sports: [], expiresAt: Date.now() + 10_000, source: 'mongodb' };
      }
      return { events: [], sports: [], expiresAt: Date.now() + 5_000, source: 'fixture' };
    }
  }

  private mongoFilter(filter: OfferTimeFilter): Record<string, unknown> {
    if (filter === 'live') return { status: 'live' };
    if (filter === 'all') return {};
    const now = new Date();
    let end = new Date(now);
    if (filter === '1h') end = new Date(now.getTime() + 60 * 60_000);
    if (filter === '3h') end = new Date(now.getTime() + 3 * 60 * 60_000);
    if (filter === 'today') end.setHours(24, 0, 0, 0);
    if (filter === 'tomorrow') {
      const start = new Date(now); start.setHours(24, 0, 0, 0);
      end = new Date(start); end.setDate(end.getDate() + 1);
      return { status: 'scheduled', startsAt: { $gte: start.toISOString(), $lt: end.toISOString() } };
    }
    return { status: 'scheduled', startsAt: { $gte: now.toISOString(), $lt: end.toISOString() } };
  }

  private clean(document: unknown): SportsEvent {
    const { _id: _discarded, ...event } = document as SportsEvent & { _id?: unknown };
    return event;
  }
}
