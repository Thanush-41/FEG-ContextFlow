import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SportsService } from './sports.service.js';

@ApiTags('sports')
@Controller('sports/events')
export class SportsController {
  constructor(@Inject(SportsService) private readonly sports: SportsService) {}

  @Get()
  list(@Query('status') status?: string) { return this.sports.list(status); }

  @Get(':eventId')
  get(@Param('eventId') eventId: string) { return this.sports.get(eventId); }
}
