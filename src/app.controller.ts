import { Controller, Get } from '@nestjs/common';
import { MessagesService } from './messages/messages.service';
import { LeagueService } from './league/league.service';

@Controller()
export class AppController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly leagueService: LeagueService,
  ) {}

  @Get('/all')
  getAllPlayRecords() {
    return this.messagesService.handleAllPlayStandings();
  }

  @Get('/actual')
  getActualRecords() {
    return this.messagesService.handleActualStandings();
  }

  @Get('/block')
  getTradeBlock() {
    return this.messagesService.handleTradeBlock();
  }
}
