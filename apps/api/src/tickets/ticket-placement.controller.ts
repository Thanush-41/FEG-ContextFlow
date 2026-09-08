import { Body, Controller, Get, Inject, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { TicketPlacementService } from './ticket-placement.service.js';

@ApiTags('ticket-placement')
@UseGuards(DemoAuthGuard)
@Controller('tickets')
export class TicketPlacementController {
  constructor(@Inject(TicketPlacementService) private readonly tickets: TicketPlacementService) {}
  @Get(':ownerId') list(@Param('ownerId') ownerId: string, @Req() request: { headers: { authorization?: string } }) {
    this.assertOwner(ownerId, request); return this.tickets.list(ownerId);
  }
  @Get(':ownerId/code/:code') findByCode(@Param('ownerId') ownerId: string, @Param('code') code: string, @Req() request: { headers: { authorization?: string } }) {
    this.assertOwner(ownerId, request); return this.tickets.findByCode(ownerId, code);
  }
  @Post('place') place(@Req() request: { headers: { authorization?: string } }, @Body() input: unknown) {
    return this.tickets.place(request.headers.authorization?.slice(7) ?? '', input);
  }
  private assertOwner(ownerId: string, request: { headers: { authorization?: string } }) {
    if (request.headers.authorization?.slice(7) !== ownerId) throw new UnauthorizedException('The authenticated demo user does not own these tickets.');
  }
}
