import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { CasinoService } from './casino.service.js';

@ApiTags('demo-casino')
@Controller('casino')
export class CasinoController {
  constructor(@Inject(CasinoService) private readonly casino: CasinoService) {}
  @Get() list() { return this.casino.list(); }
  @Post(':gameId/play')
  @UseGuards(DemoAuthGuard)
  play(@Param('gameId') gameId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) {
    return this.casino.play(request.headers.authorization?.slice(7) ?? '', gameId, input);
  }
}
