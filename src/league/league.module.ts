import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LeagueService } from './league.service';

@Module({
  imports: [HttpModule],
  providers: [LeagueService],
  exports: [LeagueService],
})
export class LeagueModule {}
