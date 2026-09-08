import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventDetailService } from './event-detail.service.js';

@ApiTags('event-detail')
@Controller('events')
export class EventDetailController {
  constructor(@Inject(EventDetailService) private readonly detail: EventDetailService) {}
  @Get(':eventId/detail') get(@Param('eventId') eventId: string) { return this.detail.get(eventId); }
  @Post(':eventId/betbuilder/validate') validate(@Param('eventId') eventId: string, @Body() input: unknown) { return this.detail.validate(eventId, input); }
}
