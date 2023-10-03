import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ILeagueInfo, ITeam } from '../types';

@Injectable()
export class LeagueService {
  // TODO: move envs to .env
  private leagueId: string = '56951748';
  private year: string = '2023';
  private espnS2: string =
    'AEAsCXK9bkxLyDJJJHSoD35LQMjPzZDSGK83MoJazUi8PpnOlmAOBK7B0U6tCo9uGYchDrIzA0%2Fs%2F%2FgG%2Fl%2FpbObQM5g8pTuBA8QXpLafgra2xWtXIS6Dda66YPuI2ej0XYKUqIk1%2F9jtipkHXQ4Dy14gxPI2GvmQjHXVWJZlt6Z4dK%2B%2FW4tllofAjCzqA6h47uXEqbOKVjxNT7p%2F3g7qlA9piL4nBOPcZyYBtcEpwCzy2tHv3iirieh5XN26hluMhGlUkVQegCXj6BlE%2BeTQwlGsR0ErChiVX9o5vQ9umI6NeTVoKOG5xLJL0SKV5NqqLBkoWFmcNybC5da3L9eiJ3tQ';
  private swid: string = '{CE676C7D-522B-43FF-8250-063992158A9D}';
  private endpoint: string = 'https://fantasy.espn.com/apis/v3/games/ffl';

  public league: ILeagueInfo;

  constructor(private readonly httpService: HttpService) {
    void this.initialize();
  }

  private async initialize() {
    try {
      this.league = await this.getLeague();
    } catch (error) {
      console.error('Error initializing team data:', error);
    }
  }

  private async getLeague(
    params = '?view=mMatchupScore&view=mTeam&view=mRoster',
  ) {
    const apiUrl = `${this.endpoint}/seasons/${this.year}/segments/0/leagues/${this.leagueId}${params}`;
    const { data } = await firstValueFrom(
      this.httpService.get<ILeagueInfo>(apiUrl, {
        headers: {
          Cookie: `SWID=${this.swid}; espn_s2=${this.espnS2}`,
        },
      }),
    );
    return data;
  }

  public getActualStandings() {
    const standings = this.league.teams.map((team) => {
      const wins = team.record.overall.wins;
      const losses = team.record.overall.losses;
      const winPercentage = (wins / (wins + losses)) * 100;

      return {
        seed: team.playoffSeed,
        name: team.name,
        wins,
        losses,
        winPercentage,
      };
    });
    return standings.sort((a, b) => a.seed - b.seed);
  }

  public getAllPlayStandings() {
    const standings: {
      team: ITeam;
      wins: number;
      losses: number;
    }[] = [];
    const week = this.league.scoringPeriodId - 1;

    const teamsSorted = this.league.teams.slice().sort((a, b) => a.id - b.id);

    for (const team of teamsSorted) {
      const record = this.getTeamAllPlayRecord(week, team, teamsSorted);
      standings.push(record);
    }

    return standings.sort((a, b) => {
      if (a.wins === b.wins) {
        return (
          b.team.record.overall.pointsFor - a.team.record.overall.pointsFor
        );
      }
      return b.wins - a.wins;
    });
  }

  public getPowerRankings() {
    const winMatrix: number[][] = [];

    const sortedTeams = this.league.teams.slice().sort((a, b) => a.id - b.id);

    for (const currentTeam of sortedTeams) {
      const wins = Array(this.league.teams.length).fill(0);

      for (let i = 0; i < this.league.scoringPeriodId - 1; i++) {
        const currentTeamPoints = this.calculateMatchupPoints(
          currentTeam.id,
          i + 1,
        ).matchupPointsFor;

        for (const opponentTeam of sortedTeams) {
          if (opponentTeam.id !== currentTeam.id) {
            const opponentPoints = this.calculateMatchupPoints(
              opponentTeam.id,
              i + 1,
            ).matchupPointsFor;

            if (currentTeamPoints > opponentPoints) {
              wins[opponentTeam.id - 1]++;
            }
          }
        }
      }

      winMatrix.push(wins);
    }

    const dominanceMatrix = this.twoStepDominance(winMatrix);
    return this.calculatePowerRankings(dominanceMatrix, sortedTeams);
  }

  private getTeamAllPlayRecord(
    week: number,
    team: ITeam,
    teamsSorted: ITeam[],
  ) {
    let wins = 0;
    let losses = 0;

    for (let i = 0; i < week; i++) {
      const teamPoints = this.calculateMatchupPoints(
        team.id,
        i + 1,
      ).matchupPointsFor;

      for (const opponentTeam of teamsSorted) {
        if (opponentTeam.id !== team.id) {
          const opponentPoints = this.calculateMatchupPoints(
            opponentTeam.id,
            i + 1,
          ).matchupPointsFor;

          if (teamPoints > opponentPoints) {
            wins++;
          } else {
            losses++;
          }
        }
      }
    }
    return {
      team,
      wins,
      losses,
    };
  }

  private calculatePowerRankings(dominanceValues: number[], teams: ITeam[]) {
    const powerRankings: string[] = [];

    for (let i = 0; i < dominanceValues.length; i++) {
      const currentTeam = teams[i];
      const averageScore =
        currentTeam.record.overall.pointsFor /
        (currentTeam.record.overall.wins + currentTeam.record.overall.losses);

      const winsWeight =
        currentTeam.record.overall.wins /
        (currentTeam.record.overall.wins + currentTeam.record.overall.losses);

      const powerRanking = (
        dominanceValues[i] * 0.4 +
        averageScore * 0.2 +
        winsWeight * 0.4
      ).toFixed(2);
      powerRankings.push(powerRanking);
    }
    return powerRankings
      .map((powerRanking, index) => ({
        points: parseFloat(powerRanking),
        team: teams[index],
      }))
      .sort((a, b) => b.points - a.points);
  }

  public calculateMatchupPoints(teamId: number, week: number) {
    let matchupPointsFor: number;
    let totalPointsFor: number = 0;

    const matchups = this.league.schedule.filter(
      (matchup) => matchup.matchupPeriodId === week,
    );

    for (const matchup of matchups) {
      const homeTeam = matchup.home;
      const awayTeam = matchup.away;

      if (homeTeam.teamId === teamId) {
        matchupPointsFor = homeTeam.totalPoints;
        totalPointsFor += homeTeam.totalPoints;
      } else if (awayTeam.teamId === teamId) {
        matchupPointsFor = awayTeam.totalPoints;
      }
    }

    return {
      teamId,
      week,
      matchupPointsFor,
      totalPointsFor,
    };
  }

  private squareMatrix(X: number[][]): number[][] {
    const dimension = X.length;
    const result: number[][] = Array(dimension);

    for (let i = 0; i < dimension; i++) {
      result[i] = Array(dimension).fill(0);
    }

    for (let i = 0; i < dimension; i++) {
      for (let k = 0; k < dimension; k++) {
        const Xik = X[i][k];
        for (let j = 0; j < dimension; j++) {
          result[i][j] += Xik * X[k][j];
        }
      }
    }

    return result;
  }

  private twoStepDominance(matrix: number[][]) {
    const squareMatrix = this.squareMatrix(matrix);
    const dimension = matrix.length;
    const result: number[] = Array(dimension).fill(0);

    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        result[i] += squareMatrix[i][j] + matrix[i][j];
      }
    }

    return result;
  }
}
