import { Body, Controller, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LiveAdminGuard } from '../live/live-admin.guard.js';
import { TicketPlacementService } from './ticket-placement.service.js';

@ApiTags('ticket-administration')
@UseGuards(LiveAdminGuard)
@Controller('admin/tickets')
export class TicketAdminController {
  constructor(@Inject(TicketPlacementService) private readonly tickets: TicketPlacementService) {}

  @Post(':ticketId/settle')
  settle(@Param('ticketId') ticketId: string, @Body() input: unknown) {
    return this.tickets.settle(ticketId, input);
  }
}
