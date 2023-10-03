import { Injectable } from '@nestjs/common';
import { LeagueService } from '../league/league.service';

@Injectable()
export class MessagesService {
  constructor(private readonly leagueService: LeagueService) {}

  async handleAllPlayStandings() {
    const standings = this.leagueService
      .getAllPlayStandings()
      .map(({ team, wins, losses }, index) => {
        const teamName = team.name.trim();
        const teamRecord = `${wins}-${losses}`;
        const percentage = (wins / (wins + losses)) * 100;
        const formattedPercentage = `${percentage.toFixed(1)}%`;

        return `${
          index + 1
        }. ${teamName} | ${teamRecord} | ${formattedPercentage}`;
      });

    return [
      'All-Play Standings',
      '————————————————————',
      standings.join('\n'),
    ].join('\n');
  }

  async handleActualStandings() {
    const standings = this.leagueService
      .getActualStandings()
      .map(({ name, wins, losses, seed, winPercentage }) => {
        const record = `${wins}-${losses}`;
        const formattedPercentage = `${winPercentage.toFixed(1)}%`;

        return `${seed}. ${name} | ${record} | ${formattedPercentage}`;
      });

    return [
      'Actual Standings',
      '————————————————————',
      standings.join('\n'),
    ].join('\n');
  }
}
