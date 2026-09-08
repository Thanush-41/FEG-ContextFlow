import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { CommunityService } from './community.service.js';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly community: CommunityService) {}
  @Get('feed') feed(@Req() request: { headers: { authorization?: string } }) { return this.community.feed(request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined); }
  @Post('posts/:postId/reaction') @UseGuards(DemoAuthGuard)
  react(@Param('postId') postId: string, @Req() request: { headers: { authorization?: string } }) { return this.community.react(request.headers.authorization?.slice(7) ?? '', postId); }
  @Post('posts/:postId/copy') @UseGuards(DemoAuthGuard)
  copy(@Param('postId') postId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) { return this.community.copy(request.headers.authorization?.slice(7) ?? '', postId, input); }
}
