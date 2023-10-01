import { Controller, Get } from '@nestjs/common';
import { LeagueService } from './league/league.service';

@Controller()
export class AppController {
  constructor(private readonly leagueService: LeagueService) {}

  @Get('/power')
  getPowerRankings() {
    return this.leagueService.getPowerRankings();
  }

  @Get('/all')
  getAllPlayRecords() {
    return this.leagueService.getAllPlayRecords();
  }
}
