export enum TradeBlockStatus {
  ON_THE_BLOCK = 'ON_THE_BLOCK',
  NORMAL = 'NORMAL',
}

interface ITradeBlock {
  players: Record<IPlayerEntry['playerId'], TradeBlockStatus>;
}

interface IRoster {
  entries: IPlayerEntry[];
}

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
      gamesBack: number;
      percentage: number;
      streakLength: number;
      streakType: 'WIN' | 'LOSS';
    };
  };
  playoffSeed: number;
  tradeBlock?: ITradeBlock;
  roster: IRoster;
}

export interface IPlayer {
  id: number;
  eligibleSlots: number[];
  firstName: string;
  lastName: string;
  fullName: string;
  proTeamId: number;
}

export interface IPlayerEntry {
  lineupSlotId: number;
  playerId: number;
  playerPoolEntry: {
    appliedStatTotal: number;
    onTeamId: number;
    player: IPlayer;
  };
}

export interface IMatchupTeam {
  teamId: number;
  totalPoints: number;
  totalPointsLive?: number;
  totalProjectedPointsLive?: number;
  rosterForCurrentScoringPeriod?: {
    entries: IPlayerEntry[];
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
