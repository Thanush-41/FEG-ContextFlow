import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { DemoTicket } from '@feg/contracts';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { TicketPlacementService } from './ticket-placement.service.js';

@ApiTags('ticket-placement')
@UseGuards(DemoAuthGuard)
@Controller('tickets')
export class TicketPlacementController {
  constructor(@Inject(TicketPlacementService) private readonly tickets: TicketPlacementService) {}
  @Get(':ownerId') list(@Param('ownerId') ownerId: string, @Query('status') status: DemoTicket['status'] | undefined, @Req() request: { headers: { authorization?: string } }) {
    this.assertOwner(ownerId, request);
    if (status && !['open', 'won', 'lost', 'void', 'cashed_out'].includes(status)) throw new BadRequestException('Invalid ticket status filter.');
    return this.tickets.list(ownerId, status);
  }
  @Get(':ownerId/code/:code') findByCode(@Param('ownerId') ownerId: string, @Param('code') code: string, @Req() request: { headers: { authorization?: string } }) {
    this.assertOwner(ownerId, request); return this.tickets.findByCode(ownerId, code);
  }
  @Post('place') place(@Req() request: { headers: { authorization?: string } }, @Body() input: unknown) {
    return this.tickets.place(request.headers.authorization?.slice(7) ?? '', input);
  }
  @Get(':ownerId/:ticketId') findById(@Param('ownerId') ownerId: string, @Param('ticketId') ticketId: string, @Req() request: { headers: { authorization?: string } }) {
    this.assertOwner(ownerId, request); return this.tickets.findById(ownerId, ticketId);
  }
  @Post(':ownerId/:ticketId/cashout/quote') quoteCashout(@Param('ownerId') ownerId: string, @Param('ticketId') ticketId: string, @Req() request: { headers: { authorization?: string } }) {
    this.assertOwner(ownerId, request); return this.tickets.quoteCashout(ownerId, ticketId);
  }
  @Post(':ownerId/:ticketId/cashout') cashout(@Param('ownerId') ownerId: string, @Param('ticketId') ticketId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) {
    this.assertOwner(ownerId, request); return this.tickets.cashout(ownerId, ticketId, input);
  }
  @Post(':ownerId/:ticketId/copy') copy(@Param('ownerId') ownerId: string, @Param('ticketId') ticketId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) {
    this.assertOwner(ownerId, request); return this.tickets.copyToSlip(ownerId, ticketId, input);
  }
  private assertOwner(ownerId: string, request: { headers: { authorization?: string } }) {
    if (request.headers.authorization?.slice(7) !== ownerId) throw new UnauthorizedException('The authenticated demo user does not own these tickets.');
  }
}
