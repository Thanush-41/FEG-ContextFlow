import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LiveAdminGuard } from './live-admin.guard.js';
import { LiveSimulationService } from './live-simulation.service.js';

@ApiTags('live-simulator')
@UseGuards(LiveAdminGuard)
@Controller('admin/live')
export class LiveAdminController {
  constructor(@Inject(LiveSimulationService) private readonly simulator: LiveSimulationService) {}
  @Get() list() { return this.simulator.list(); }
  @Get(':eventId') get(@Param('eventId') eventId: string) { return this.simulator.get(eventId); }
  @Post(':eventId/control') control(@Param('eventId') eventId: string, @Body() input: unknown) { return this.simulator.control(eventId, input); }
}
