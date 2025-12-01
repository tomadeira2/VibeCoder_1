export interface Player {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  tournamentsPlayed: number;
  totalPoints: number;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  playerIds: string[];
  roundRobinMatches: Match[];
  knockoutMatches: Match[];
  pointsDistribution: PointsDistribution;
  createdAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  score?: Score;
  stage: 'round_robin' | 'quarter_final' | 'semi_final' | 'final';
  completed: boolean;
  playedAt?: string;
}

export interface Team {
  player1Id: string;
  player2Id: string;
}

export interface Score {
  team1Sets: number;
  team2Sets: number;
  sets: SetScore[];
}

export interface SetScore {
  team1Games: number;
  team2Games: number;
}

export interface PointsDistribution {
  winner: number;
  runnerUp: number;
  semiFinal: number;
  quarterFinal: number;
  roundRobinWin: number;
  participation: number;
}

export interface RoundRobinStanding {
  teamKey: string;
  player1Id: string;
  player2Id: string;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export interface Ranking {
  playerId: string;
  playerName: string;
  totalPoints: number;
  tournamentsPlayed: number;
  wins: number;
  losses: number;
  rank: number;
}
