import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { LottoService } from './lotto.service.js';

@ApiTags('demo-lotto')
@Controller('lotto')
export class LottoController {
  constructor(@Inject(LottoService) private readonly lotto: LottoService) {}
  @Get('draws') draws() { return this.lotto.listDraws(); }
  @Get('entries') @UseGuards(DemoAuthGuard)
  entries(@Req() request: { headers: { authorization?: string } }) { return this.lotto.listEntries(request.headers.authorization?.slice(7) ?? ''); }
  @Post('draws/:drawId/entries') @UseGuards(DemoAuthGuard)
  create(@Param('drawId') drawId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) { return this.lotto.create(request.headers.authorization?.slice(7) ?? '', drawId, input); }
}
