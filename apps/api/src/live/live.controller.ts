import { Controller, Get, Inject } from '@nestjs/common';
import { LiveSimulationService } from './live-simulation.service.js';

@Controller('live')
export class LiveController {
  constructor(@Inject(LiveSimulationService) private readonly simulator: LiveSimulationService) {}
  @Get('snapshots') snapshots() { return this.simulator.list(); }
}
