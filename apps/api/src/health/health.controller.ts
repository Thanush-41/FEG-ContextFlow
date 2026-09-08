import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'Process health and service version' })
  getHealth() {
    return {
      status: 'ok' as const,
      service: 'feg-contextflow-api',
      version: '0.1.0',
    };
  }
}
