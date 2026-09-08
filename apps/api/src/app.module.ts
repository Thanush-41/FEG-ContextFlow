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
import {
  BET_SLIP_MODEL,
  DEMO_TICKET_MODEL,
  EVENT_DETAIL_MODEL,
  SPORTS_EVENT_MODEL,
  betSlipSchema,
  demoTicketSchema,
  eventDetailSchema,
  sportsEventSchema,
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
      ]),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...persistenceImports,
  ],
  controllers: [HealthController, SportsController, BetsController, OfferController, EventDetailController, SlipsController],
  providers: [RealtimeGateway, SportsService, BetsService, PskOfferProvider, OfferService, EventDetailService, SlipsService],
})
export class AppModule {}
