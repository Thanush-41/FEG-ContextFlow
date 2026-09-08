import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health/health.controller.js';
import { RealtimeGateway } from './realtime/realtime.gateway.js';
import { BetsController } from './bets/bets.controller.js';
import { BetsService } from './bets/bets.service.js';
import { SportsController } from './sports/sports.controller.js';
import { SportsService } from './sports/sports.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(process.env.MONGODB_URI
      ? [MongooseModule.forRoot(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 })]
      : []),
  ],
  controllers: [HealthController, SportsController, BetsController],
  providers: [RealtimeGateway, SportsService, BetsService],
})
export class AppModule {}
