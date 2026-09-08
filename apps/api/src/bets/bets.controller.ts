import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PlaceDemoBet } from '@feg/contracts';
import { BetsService } from './bets.service.js';

@ApiTags('bets')
@Controller('bets')
export class BetsController {
  constructor(@Inject(BetsService) private readonly bets: BetsService) {}
  @Get() list() { return this.bets.list(); }
  @Get(':ticketId') get(@Param('ticketId') ticketId: string) { return this.bets.get(ticketId); }
  @Post() place(@Body() input: PlaceDemoBet) { return this.bets.place(input); }
}
