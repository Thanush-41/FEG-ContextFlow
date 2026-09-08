import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { VirtualsService } from './virtuals.service.js';

@ApiTags('virtuals-and-results') @Controller()
export class VirtualsController {
  constructor(@Inject(VirtualsService) private readonly virtuals: VirtualsService) {}
  @Get('virtuals/events') schedule() { return this.virtuals.schedule(); }
  @Post('virtuals/events/:eventId/play') @UseGuards(DemoAuthGuard)
  play(@Param('eventId') eventId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) { return this.virtuals.play(request.headers.authorization?.slice(7) ?? '', eventId, input); }
  @Get('results') results(@Req() request: { headers: { authorization?: string } }) { return this.virtuals.results(request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined); }
  @Post('results/competitions/:competitionId/favorite') @UseGuards(DemoAuthGuard)
  favorite(@Param('competitionId') competitionId: string, @Req() request: { headers: { authorization?: string } }) { return this.virtuals.toggleFavorite(request.headers.authorization?.slice(7) ?? '', competitionId); }
}
