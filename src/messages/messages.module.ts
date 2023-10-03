import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { LeagueModule } from '../league/league.module';

@Module({
  imports: [LeagueModule],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
