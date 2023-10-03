import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeagueModule } from './league/league.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [LeagueModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
