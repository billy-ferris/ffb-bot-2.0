import { Injectable } from '@nestjs/common';
import { LeagueService } from '../league/league.service';
import { nflTeamIdToNFLTeamAbbreviation } from '../constants';
import { IPlayer } from '../types';

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

  async handleTradeBlock() {
    const tradeBlock = this.leagueService
      .getPlayersOnTradeBlockByTeam()
      .map(({ team, players }) => {
        const playerStrings = this.formatPlayerStrings(players);
        return [team.name, playerStrings].join(': ');
      });

    const header = ['Trade Block', '————————————————————'].join('\n');
    return [header, ...tradeBlock].join('\n');
  }

  private formatPlayerStrings(players: IPlayer[]) {
    return players
      .map(
        (player) =>
          `${nflTeamIdToNFLTeamAbbreviation[player.proTeamId]} ${
            player.firstName.split('')[0]
          }. ${player.lastName}`,
      )
      .join(', ');
  }
}
