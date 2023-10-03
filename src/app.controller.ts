import { Controller, Get } from '@nestjs/common';
import { MessagesService } from './messages/messages.service';

@Controller()
export class AppController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('/all')
  getAllPlayRecords() {
    return this.messagesService.handleAllPlayStandings();
  }

  @Get('/actual')
  getActualRecords() {
    return this.messagesService.handleActualStandings();
  }
}
