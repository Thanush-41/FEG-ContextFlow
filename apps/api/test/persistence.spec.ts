import mongoose, { type Model } from 'mongoose';
import { jest } from '@jest/globals';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { SportsEvent } from '@feg/contracts';
import { OfferService } from '../src/offer/offer.service.js';
import type { PskOfferProvider } from '../src/offer/psk-offer.provider.js';
import { EventDetailService } from '../src/event-detail/event-detail.service.js';
import { SportsService } from '../src/sports/sports.service.js';
import { SlipsService } from '../src/slips/slips.service.js';
import { TicketPlacementService } from '../src/tickets/ticket-placement.service.js';
import { WalletService } from '../src/wallet/wallet.service.js';
import { BET_SLIP_MODEL, DEMO_TICKET_MODEL, EVENT_DETAIL_MODEL, LEDGER_ENTRY_MODEL, SPORTS_EVENT_MODEL, WALLET_MODEL, betSlipSchema, demoTicketSchema, eventDetailSchema, ledgerEntrySchema, sportsEventSchema, walletSchema } from '../src/persistence/models.js';

describe('MongoDB offer cache', () => {
  let server: MongoMemoryReplSet;
  let model: Model<SportsEvent>;
  const event: SportsEvent = {
    id: 'event-persistence-001', sportId: 'sport-football', leagueId: 'league-cache-001',
    sport: 'Football', league: 'Cache League', startsAt: '2026-09-08T17:00:00.000Z', status: 'scheduled',
    home: 'Cache Home', away: 'Cache Away', totalMarketCount: 1, features: ['betBuilder'],
    markets: [{ id: 'market-cache-001', name: 'Result', features: [], selections: [
      { id: 'selection-cache-home', label: '1', odds: 2, state: 'active', features: [] },
      { id: 'selection-cache-away', label: '2', odds: 3, state: 'active', features: [] },
    ] }],
  };

  beforeAll(async () => {
    server = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(server.getUri(), { dbName: 'feg_sprint5_test' });
    model = mongoose.connection.model<SportsEvent>(SPORTS_EVENT_MODEL, sportsEventSchema);
  }, 120_000);
  afterAll(async () => { await mongoose.disconnect(); await server.stop(); }, 30_000);

  it('persists provider data and serves it when the upstream provider fails', async () => {
    const online = new OfferService({ load: async () => ({ events: [event], sports: [] }) } as unknown as PskOfferProvider, model);
    expect((await online.get('all', 0, 100)).cache.source).toBe('psk');
    expect(await model.countDocuments({ id: event.id })).toBe(1);

    const offline = new OfferService({ load: async () => { throw new Error('offline'); } } as unknown as PskOfferProvider, model);
    const cached = await offline.get('all', 0, 100);
    expect(cached.cache.source).toBe('mongodb');
    expect(cached.leagues[0]?.events[0]?.home).toBe('Cache Home');
  });

  it('persists versioned event markets, periods, statistics, lineups, and price history', async () => {
    const detailModel: Model<any> = mongoose.connection.model(EVENT_DETAIL_MODEL, eventDetailSchema);
    const service = new EventDetailService(new SportsService(), detailModel);
    const detail = await service.get('event-basketball-finished');
    const stored = await detailModel.findOne({ eventId: detail.event.id }).lean().exec();
    expect(stored?.version).toBe(1);
    expect(stored?.markets).toHaveLength(6);
    expect(stored?.markets[0]?.outcomes[0]?.priceHistory).toHaveLength(2);
    expect(stored?.result?.winner).toBe('home');
    expect(stored?.lineups?.home).toHaveLength(11);
  });

  it('persists slips and rejects a concurrent stale price update deterministically', async () => {
    const slipModel: Model<any> = mongoose.connection.model(BET_SLIP_MODEL, betSlipSchema);
    const detail = new EventDetailService(new SportsService());
    const firstClient = new SlipsService(detail, slipModel);
    const secondClient = new SlipsService(detail, slipModel);
    const created = await firstClient.add('guest-persist-001', 1, { eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.6, expectedVersion: 0 });
    const stale = await secondClient.get('guest-persist-001', 1);
    expect(created.warnings[0]?.code).toBe('ODDS_CHANGED');
    await firstClient.update('guest-persist-001', 1, { expectedVersion: created.version, acceptOddsChanges: true });
    await expect(secondClient.update('guest-persist-001', 1, { expectedVersion: stale.version, stakeMinorUnits: 500 })).rejects.toMatchObject({ status: 409 });
    expect(await slipModel.countDocuments({ ownerId: 'guest-persist-001', tab: 1 })).toBe(1);
  });

  it('rolls the wallet debit back when ticket persistence fails', async () => {
    const slipModel: Model<any> = mongoose.connection.model(BET_SLIP_MODEL, betSlipSchema);
    const walletModel: Model<any> = mongoose.connection.model(WALLET_MODEL, walletSchema);
    const ledgerModel: Model<any> = mongoose.connection.model(LEDGER_ENTRY_MODEL, ledgerEntrySchema);
    const ticketModel: Model<any> = mongoose.connection.model(DEMO_TICKET_MODEL, demoTicketSchema);
    const details = new EventDetailService(new SportsService());
    const slips = new SlipsService(details, slipModel);
    const wallets = new WalletService(walletModel, ledgerModel);
    const placement = new TicketPlacementService(slips, details, wallets, ticketModel);
    const owner = 'rollback-persist-user';
    const slip = await slips.add(owner, 1, { eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.55, expectedVersion: 0 });
    const before = await wallets.get(owner);
    jest.spyOn(ticketModel, 'create').mockRejectedValueOnce(new Error('forced ticket failure') as never);
    await expect(placement.place(owner, { ownerId: owner, tab: 1, expectedVersion: slip.version, idempotencyKey: 'e0e30d27-a79c-4304-90da-6b8f0d875b8d' })).rejects.toThrow('forced ticket failure');
    expect((await wallets.get(owner)).availableMinorUnits).toBe(before.availableMinorUnits);
    expect(await ledgerModel.countDocuments({ userId: owner })).toBe(0);
    expect(await ticketModel.countDocuments({ 'audit.actor': owner })).toBe(0);
  });
});
