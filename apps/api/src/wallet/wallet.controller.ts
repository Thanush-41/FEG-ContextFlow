import { Body, Controller, Get, Inject, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { WalletService } from './wallet.service.js';

@ApiTags('demo-wallet')
@UseGuards(DemoAuthGuard)
@Controller('wallets/:userId')
export class WalletController {
  constructor(@Inject(WalletService) private readonly wallet: WalletService) {}
  @Get() get(@Param('userId') userId: string, @Req() request: Request) { this.assertOwner(userId, request); return this.wallet.get(userId); }
  @Get('ledger') history(@Param('userId') userId: string, @Req() request: Request) { this.assertOwner(userId, request); return this.wallet.history(userId); }
  @Post('deposit') deposit(@Param('userId') userId: string, @Req() request: Request, @Body() input: unknown) { this.assertOwner(userId, request); return this.wallet.deposit(userId, input); }
  @Post('withdraw') withdraw(@Param('userId') userId: string, @Req() request: Request, @Body() input: unknown) { this.assertOwner(userId, request); return this.wallet.withdraw(userId, input); }

  private assertOwner(userId: string, request: Request) {
    if (request.headers.authorization?.slice(7) !== userId) throw new UnauthorizedException('The authenticated demo user does not own this wallet.');
  }
}
