import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagesService } from './messages/messages.service';
import { LeagueService } from './league/league.service';
import { GroupMeService } from './groupme/groupme.service';

@Controller()
export class AppController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly leagueService: LeagueService,
    private readonly groupmeService: GroupMeService,
  ) {}

  @Post('/bot')
  processMessage(@Body() msg: { text: string }) {
    this.groupmeService.processMessage(msg);
  }

  @Get('/all')
  async getAllPlayRecords() {
    const message = await this.messagesService.handleAllPlayStandings();
    return this.groupmeService.postMessage(message);
  }

  @Get('/actual')
  async getActualRecords() {
    const message = await this.messagesService.handleActualStandings();
    return this.groupmeService.postMessage(message);
  }

  @Get('/trade')
  async getTradeBlock() {
    const message = await this.messagesService.handleTradeBlock();
    return this.groupmeService.postMessage(message);
  }
}
