import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ILeagueInfo,
  IMatchupTeam,
  IPlayer,
  ITeam,
  TradeBlockStatus,
} from '../types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LeagueService {
  private leagueId: string = this.configService.get<string>('LEAGUE_ID');
  private year: string = this.configService.get<string>('SEASON_ID');
  private espnS2: string = this.configService.get<string>('ESPN_S2');
  private swid: string = this.configService.get<string>('SWID');
  private endpoint: string = 'https://fantasy.espn.com/apis/v3/games/ffl';

  public league: ILeagueInfo;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

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

  public async getMatchupsForCurrentWeek(teamAbbrev?: string) {
    this.league = await this.getLeague();
    const currentWeek = this.league.scoringPeriodId;

    const relevantMatchups = this.league.schedule.filter(
      (matchup) => matchup.matchupPeriodId === currentWeek,
    );

    const matchups = relevantMatchups.map((matchup) => {
      const homeTeam = this.getMatchupTeam(matchup.home, this.league.teams);
      const awayTeam = this.getMatchupTeam(matchup.away, this.league.teams);

      return {
        id: matchup.id,
        matchupPeriodId: matchup.matchupPeriodId,
        home: {
          ...homeTeam,
          totalPointsLastThreeWeeksAvg: this.calculateThreeWeekAverage(
            homeTeam.teamId,
            currentWeek,
          ),
        },
        away: {
          ...awayTeam,
          totalPointsThreeWeekAvg: this.calculateThreeWeekAverage(
            awayTeam.teamId,
            currentWeek,
          ),
        },
      };
    });

    if (teamAbbrev) {
      const team = this.league.teams.find(
        (t) => t.abbrev.toLowerCase() === teamAbbrev.toLowerCase(),
      );
      if (team) {
        return matchups.filter(
          (matchup) =>
            matchup.home.teamId === team.id || matchup.away.teamId === team.id,
        );
      }
    }

    return matchups;
  }

  private calculateThreeWeekAverage(teamId: number, week: number): number {
    const startWeek = Math.max(1, week - 3);
    const endWeek = week - 1;

    const teamMatchups = this.league.schedule.filter(
      (matchup) =>
        matchup.home.teamId === teamId || matchup.away.teamId === teamId,
    );

    const teamPoints = teamMatchups
      .filter(
        (matchup) =>
          matchup.matchupPeriodId >= startWeek &&
          matchup.matchupPeriodId <= endWeek,
      )
      .map((matchup) =>
        matchup.home.teamId === teamId
          ? matchup.home.totalPoints
          : matchup.away.totalPoints,
      );

    const lastThreeWeeksPoints = teamPoints.slice(-3);

    console.log();

    return (
      lastThreeWeeksPoints.reduce((total, point) => total + point, 0) /
        lastThreeWeeksPoints.length || 0
    );
  }

  private getMatchupTeam(matchupTeam: IMatchupTeam, teams: ITeam[]) {
    const team = teams.find((t) => t.id === matchupTeam.teamId);

    if (team) {
      return {
        teamId: matchupTeam.teamId,
        totalPoints: matchupTeam.totalPoints,
        totalPointsLive: matchupTeam.totalPointsLive,
        totalProjectedPointsLive: matchupTeam.totalProjectedPointsLive,
        rosterForCurrentScoringPeriod: matchupTeam.rosterForCurrentScoringPeriod
          ?.entries
          ? { entries: matchupTeam.rosterForCurrentScoringPeriod.entries }
          : undefined,
        team,
      };
    }

    return null;
  }

  public async getActualStandings() {
    this.league = await this.getLeague();

    const standings = this.league.teams.map((team) => {
      const wins = team.record.overall.wins;
      const losses = team.record.overall.losses;
      const winPercentage = (wins / (wins + losses)) * 100;

      return {
        seed: team.playoffSeed,
        name: team.name.trim(),
        wins,
        losses,
        winPercentage,
      };
    });
    return standings.sort((a, b) => a.seed - b.seed);
  }

  public async getAllPlayRecords(week?: number) {
    this.league = await this.getLeague();

    const isValidWeekArg =
      !!week && week > 0 && week < this.league.scoringPeriodId;

    const standings = this.league.teams.map((team) => {
      const record = isValidWeekArg
        ? this.getTeamAllPlayRecordForWeek(week, team)
        : this.getTeamAllPlayRecordForSeason(team);

      return {
        week,
        team,
        wins: record.wins,
        losses: record.losses,
      };
    });

    standings.sort((a, b) => {
      if (a.wins === b.wins) {
        return (
          b.team.record.overall.pointsFor - a.team.record.overall.pointsFor
        );
      }
      return b.wins - a.wins;
    });

    return standings.map((record, index) => {
      const seed = index + 1;
      const wins = record.wins;
      const losses = record.losses;
      const winPercentage = (wins / (wins + losses)) * 100;

      return {
        seed,
        name: record.team.name.trim(),
        wins,
        losses,
        winPercentage,
      };
    });
  }

  public async getPlayersOnTradeBlockByTeam() {
    this.league = await this.getLeague();

    const teamsWithPlayersOnTradeBlock: {
      team: ITeam;
      players: IPlayer[];
    }[] = [];

    for (const team of this.league.teams) {
      const tradeBlock = team.tradeBlock?.players || {};
      const onTheBlockPlayers = Object.fromEntries(
        Object.entries(tradeBlock).filter(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_, status]) => status === TradeBlockStatus.ON_THE_BLOCK,
        ),
      );

      const playersOnTradeBlock: IPlayer[] = [];

      for (const playerId in onTheBlockPlayers) {
        const player = this.getPlayerFromTeamRosterById(team, playerId);

        if (player) {
          playersOnTradeBlock.push(player);
        }
      }

      if (playersOnTradeBlock.length > 0) {
        teamsWithPlayersOnTradeBlock.push({
          team,
          players: playersOnTradeBlock,
        });
      }
    }

    return teamsWithPlayersOnTradeBlock;
  }

  public async getPowerRankings() {
    this.league = await this.getLeague();

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

  public async getHighestScoringTeamForWeek(week?: number) {
    this.league = await this.getLeague();

    const previousWeek = this.league.scoringPeriodId - 1;

    if (!week || week <= 0 || week >= previousWeek) {
      week = previousWeek;
    }

    const { team, score } = this.league.teams.reduce(
      (highestScoringTeam, team) => {
        const matchupPoints = this.calculateMatchupPoints(
          team.id,
          week,
        ).matchupPointsFor;

        return matchupPoints > highestScoringTeam.score
          ? { team, score: matchupPoints }
          : highestScoringTeam;
      },
      { team: null, score: 0 },
    );

    return {
      name: team.name,
      score,
    };
  }

  public async getLuckiestTeamForWeek(week?: number) {
    this.league = await this.getLeague();

    const previousWeek = this.league.scoringPeriodId - 1;

    if (!week || week <= 0 || week >= previousWeek) {
      week = previousWeek;
    }

    const teamsWithWins: ITeam[] = this.league.teams.filter((team) => {
      const { wins, losses } = this.getTeamActualRecordForWeek(week, team);
      return wins > losses;
    });

    let luckiestTeam: ITeam;
    let minAllPlayRecord = { wins: this.league.teams.length - 1, losses: 0 };

    for (const team of teamsWithWins) {
      const allPlayRecord = this.getTeamAllPlayRecordForWeek(week, team);
      if (allPlayRecord.wins < minAllPlayRecord.wins) {
        minAllPlayRecord = allPlayRecord;
        luckiestTeam = team;
      }
    }
    const wins = minAllPlayRecord.wins;
    const losses = minAllPlayRecord.losses;
    const winPercentage = (wins / (wins + losses)) * 100;

    return {
      name: luckiestTeam.name.trim(),
      wins,
      losses,
      winPercentage,
    };
  }

  private getTeamAllPlayRecordForSeason(team: ITeam) {
    let wins = 0;
    let losses = 0;

    for (let i = 0; i < this.league.scoringPeriodId - 1; i++) {
      const { wins: weeklyWins, losses: weeklyLosses } =
        this.getTeamAllPlayRecordForWeek(i + 1, team);
      wins += weeklyWins;
      losses += weeklyLosses;
    }

    return {
      team,
      wins,
      losses,
    };
  }

  private getTeamAllPlayRecordForWeek(week: number, team: ITeam) {
    let wins = 0;
    let losses = 0;

    const teamPoints = this.calculateMatchupPoints(
      team.id,
      week,
    ).matchupPointsFor;

    for (const opponentTeam of this.league.teams.filter(
      (t) => t.id !== team.id,
    )) {
      const opponentPoints = this.calculateMatchupPoints(
        opponentTeam.id,
        week,
      ).matchupPointsFor;

      if (teamPoints > opponentPoints) {
        wins++;
      } else {
        losses++;
      }
    }

    return {
      wins,
      losses,
    };
  }

  private getTeamActualRecordForWeek(week: number, team: ITeam) {
    let wins = 0;
    let losses = 0;

    const matchups = this.league.schedule.filter(
      (matchup) => matchup.matchupPeriodId === week,
    );

    for (const matchup of matchups) {
      const homeTeam = matchup.home;
      const awayTeam = matchup.away;

      if (homeTeam.teamId === team.id) {
        if (homeTeam.totalPoints > awayTeam.totalPoints) {
          wins++;
        } else {
          losses++;
        }
      } else if (awayTeam.teamId === team.id) {
        if (awayTeam.totalPoints > homeTeam.totalPoints) {
          wins++;
        } else {
          losses++;
        }
      }
    }

    return {
      wins,
      losses,
    };
  }

  private calculatePowerRankings(dominanceValues: number[], teams: ITeam[]) {
    return dominanceValues
      .map((dominance, i) => {
        const currentTeam = teams[i];
        const { wins, losses, pointsFor } = currentTeam.record.overall;

        const averageScore = pointsFor / (wins + losses);
        const winsWeight = wins / (wins + losses);
        const powerRanking = (
          dominance * 0.4 +
          averageScore * 0.2 +
          winsWeight * 0.4
        ).toFixed(2);

        return {
          points: parseFloat(powerRanking),
          team: currentTeam,
        };
      })
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

  private getPlayerFromTeamRosterById(team: ITeam, playerId: string) {
    const entry = team.roster.entries.find(
      (entry) => entry.playerId === Number(playerId),
    );

    return entry ? entry.playerPoolEntry.player : null;
  }
}
