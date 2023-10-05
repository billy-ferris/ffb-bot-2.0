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
  getMessage(@Body() data: Record<string, any>) {
    console.log(data);
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

  @Get('/block')
  async getTradeBlock() {
    const message = await this.messagesService.handleTradeBlock();
    return this.groupmeService.postMessage(message);
  }
}
