import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health/health.controller.js';
import { RealtimeGateway } from './realtime/realtime.gateway.js';
import { BetsController } from './bets/bets.controller.js';
import { BetsService } from './bets/bets.service.js';
import { SportsController } from './sports/sports.controller.js';
import { SportsService } from './sports/sports.service.js';
import { OfferController } from './offer/offer.controller.js';
import { OfferService } from './offer/offer.service.js';
import { PskOfferProvider } from './offer/psk-offer.provider.js';
import { EventDetailController } from './event-detail/event-detail.controller.js';
import { EventDetailService } from './event-detail/event-detail.service.js';
import { SlipsController } from './slips/slips.controller.js';
import { SlipsService } from './slips/slips.service.js';
import { DemoAuthGuard } from './platform/demo-auth.guard.js';
import { WalletController } from './wallet/wallet.controller.js';
import { WalletService } from './wallet/wallet.service.js';
import { TicketPlacementController } from './tickets/ticket-placement.controller.js';
import { TicketPlacementService } from './tickets/ticket-placement.service.js';
import { TicketAdminController } from './tickets/ticket-admin.controller.js';
import { LiveAdminController } from './live/live-admin.controller.js';
import { LiveController } from './live/live.controller.js';
import { LiveAdminGuard } from './live/live-admin.guard.js';
import { LiveSimulationService } from './live/live-simulation.service.js';
import { CasinoController } from './casino/casino.controller.js';
import { CasinoService } from './casino/casino.service.js';
import { AccountController } from './account/account.controller.js';
import { AccountService } from './account/account.service.js';
import { DiscoveryController } from './discovery/discovery.controller.js';
import { DiscoveryService } from './discovery/discovery.service.js';
import { CommunityController } from './community/community.controller.js';
import { CommunityService } from './community/community.service.js';
import { LottoController } from './lotto/lotto.controller.js';
import { LottoService } from './lotto/lotto.service.js';
import {
  BET_SLIP_MODEL,
  DEMO_TICKET_MODEL,
  EVENT_DETAIL_MODEL,
  LEDGER_ENTRY_MODEL,
  SPORTS_EVENT_MODEL,
  WALLET_MODEL,
  DEMO_PROFILE_MODEL,
  DEMO_SESSION_MODEL,
  LOTTO_ENTRY_MODEL,
  betSlipSchema,
  demoTicketSchema,
  eventDetailSchema,
  ledgerEntrySchema,
  sportsEventSchema,
  walletSchema,
  demoProfileSchema,
  demoSessionSchema,
  lottoEntrySchema,
} from './persistence/models.js';

const mongoUri = process.env.MONGODB_URI;
const persistenceImports = mongoUri
  ? [
      MongooseModule.forRoot(mongoUri, { serverSelectionTimeoutMS: 5_000 }),
      MongooseModule.forFeature([
        { name: SPORTS_EVENT_MODEL, schema: sportsEventSchema },
        { name: DEMO_TICKET_MODEL, schema: demoTicketSchema },
        { name: EVENT_DETAIL_MODEL, schema: eventDetailSchema },
        { name: BET_SLIP_MODEL, schema: betSlipSchema },
        { name: WALLET_MODEL, schema: walletSchema },
        { name: LEDGER_ENTRY_MODEL, schema: ledgerEntrySchema },
        { name: DEMO_PROFILE_MODEL, schema: demoProfileSchema },
        { name: DEMO_SESSION_MODEL, schema: demoSessionSchema },
        { name: LOTTO_ENTRY_MODEL, schema: lottoEntrySchema },
      ]),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...persistenceImports,
  ],
  controllers: [HealthController, SportsController, BetsController, OfferController, EventDetailController, SlipsController, WalletController, TicketPlacementController, TicketAdminController, LiveAdminController, LiveController, CasinoController, AccountController, DiscoveryController, CommunityController, LottoController],
  providers: [LiveSimulationService, RealtimeGateway, SportsService, BetsService, PskOfferProvider, OfferService, EventDetailService, SlipsService, WalletService, TicketPlacementService, CasinoService, AccountService, DiscoveryService, CommunityService, LottoService, DemoAuthGuard, LiveAdminGuard],
})
export class AppModule {}
