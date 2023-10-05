import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeagueModule } from './league/league.module';
import { MessagesModule } from './messages/messages.module';
import { GroupMeModule } from './groupme/groupme.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    GroupMeModule,
    LeagueModule,
    MessagesModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
