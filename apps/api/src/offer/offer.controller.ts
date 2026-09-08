import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OfferTimeFilterSchema } from '@feg/contracts';
import { OfferService } from './offer.service.js';

@ApiTags('offer')
@Controller('offer')
export class OfferController {
  constructor(@Inject(OfferService) private readonly offer: OfferService) {}

  @Get()
  get(@Query('timeFilter') candidate = 'today', @Query('cursor') rawCursor = '0', @Query('limit') rawLimit = '100') {
    const parsed = OfferTimeFilterSchema.safeParse(candidate);
    const cursor = Number(rawCursor); const limit = Number(rawLimit);
    if (!parsed.success || !Number.isInteger(cursor) || cursor < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid offer query.');
    }
    return this.offer.get(parsed.data, cursor, limit);
  }
}
