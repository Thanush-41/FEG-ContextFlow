import { Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { DiscoveryService } from './discovery.service.js';

@ApiTags('discovery')
@Controller()
export class DiscoveryController {
  constructor(@Inject(DiscoveryService) private readonly discovery: DiscoveryService) {}

  @Get('discovery/promotions')
  promotions(@Req() request: { headers: { authorization?: string } }) {
    return this.discovery.listPromotions(request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined);
  }

  @Post('discovery/promotions/:promotionId/opt-in')
  @UseGuards(DemoAuthGuard)
  optIn(@Param('promotionId') promotionId: string, @Req() request: { headers: { authorization?: string } }) {
    return this.discovery.optIn(request.headers.authorization?.slice(7) ?? '', promotionId);
  }

  @Get('content')
  content(@Query('kind') kind?: string) { return this.discovery.listContent(kind); }

  @Get('content/:articleId')
  article(@Param('articleId') articleId: string) { return this.discovery.article(articleId); }
}
