import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeagueModule } from './league/league.module';

@Module({
  imports: [LeagueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
