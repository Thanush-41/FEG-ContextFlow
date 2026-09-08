import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DemoAuthGuard } from '../platform/demo-auth.guard.js';
import { AccountService } from './account.service.js';

@ApiTags('demo-account')
@UseGuards(DemoAuthGuard)
@Controller('account/:userId')
export class AccountController {
  constructor(@Inject(AccountService) private readonly account: AccountService) {}
  @Get('profile') profile(@Param('userId') userId: string, @Req() request: { headers: { authorization?: string } }) { this.assertOwner(userId, request); return this.account.profile(userId); }
  @Patch('profile') update(@Param('userId') userId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) { this.assertOwner(userId, request); return this.account.updateProfile(userId, input); }
  @Get('sessions') sessions(@Param('userId') userId: string, @Req() request: { headers: { authorization?: string } }) { this.assertOwner(userId, request); return this.account.sessions(userId); }
  @Post('sessions') createSession(@Param('userId') userId: string, @Req() request: { headers: { authorization?: string } }, @Body() input: unknown) { this.assertOwner(userId, request); return this.account.createSession(userId, input); }
  @Delete('sessions/:sessionId') revoke(@Param('userId') userId: string, @Param('sessionId') sessionId: string, @Req() request: { headers: { authorization?: string } }) { this.assertOwner(userId, request); return this.account.revokeSession(userId, sessionId); }
  private assertOwner(userId: string, request: { headers: { authorization?: string } }) { if (request.headers.authorization?.slice(7) !== userId) throw new UnauthorizedException('The authenticated demo user does not own this account.'); }
}
