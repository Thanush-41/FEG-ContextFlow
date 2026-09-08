import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SlipsService } from './slips.service.js';

@ApiTags('bet-slips')
@Controller('slips/:ownerId/tabs/:tab')
export class SlipsController {
  constructor(@Inject(SlipsService) private readonly slips: SlipsService) {}
  @Get() get(@Param('ownerId') ownerId: string, @Param('tab', ParseIntPipe) tab: number) { return this.slips.get(ownerId, tab); }
  @Post('selections') add(@Param('ownerId') ownerId: string, @Param('tab', ParseIntPipe) tab: number, @Body() input: unknown) { return this.slips.add(ownerId, tab, input); }
  @Delete('selections/:selectionId') remove(@Param('ownerId') ownerId: string, @Param('tab', ParseIntPipe) tab: number, @Param('selectionId') selectionId: string, @Body() input: unknown) { return this.slips.remove(ownerId, tab, selectionId, input); }
  @Patch() update(@Param('ownerId') ownerId: string, @Param('tab', ParseIntPipe) tab: number, @Body() input: unknown) { return this.slips.update(ownerId, tab, input); }
  @Delete() clear(@Param('ownerId') ownerId: string, @Param('tab', ParseIntPipe) tab: number, @Body() input: unknown) { return this.slips.clear(ownerId, tab, input); }
}
