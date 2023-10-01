export interface ITeam {
  id: number;
  name: string;
  abbrev: string;
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    };
  };
  playoffSeed: number;
}

export interface IPlayer {
  lineupSlotId: number;
  playerId: number;
  playerPoolEntry: {
    appliedStatTotal: number;
    onTeamId: number;
    player: {
      id: number;
      eligibleSlots: number[];
      firstName: string;
      lastName: string;
      fullName: string;
      proTeamId: number;
    };
  };
}

export interface IMatchupTeam {
  teamId: number;
  totalPoints: number;
  totalPointsLive: number;
  totalProjectedPointsLive: number;
  rosterForCurrentScoringPeriod: {
    entries: IPlayer[];
  };
}

export interface IMatchup {
  id: number;
  matchupPeriodId: number;
  home: IMatchupTeam;
  away: IMatchupTeam;
}

export interface ILeagueInfo {
  gameId: number;
  id: number;
  scoringPeriodId: number;
  seasonId: number;
  segmentId: number;
  teams: ITeam[];
  schedule: IMatchup[];
}
