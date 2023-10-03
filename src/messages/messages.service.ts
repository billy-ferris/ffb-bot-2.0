import { Injectable } from '@nestjs/common';
import { LeagueService } from '../league/league.service';

@Injectable()
export class MessagesService {
  constructor(private readonly leagueService: LeagueService) {}

  async handleAllPlayStandings() {
    const standings = this.leagueService
      .getAllPlayStandings()
      .map(({ name, wins, losses, seed, winPercentage }) => {
        const record = `${wins}-${losses}`;
        const formattedPercentage = `${winPercentage.toFixed(1)}%`;

        return `${seed}. ${name} | ${record} | ${formattedPercentage}`;
      });

    const header = ['All-Play Standings', '————————————————————'].join('\n');

    return [header, ...standings].join('\n');
  }

  async handleActualStandings() {
    const standings = this.leagueService
      .getActualStandings()
      .map(({ name, wins, losses, seed, winPercentage }) => {
        const record = `${wins}-${losses}`;
        const formattedPercentage = `${winPercentage.toFixed(1)}%`;

        return `${seed}. ${name} | ${record} | ${formattedPercentage}`;
      });

    const header = ['Actual Standings', '————————————————————'].join('\n');

    return [header, ...standings].join('\n');
  }
}
