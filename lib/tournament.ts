import { Player, Team, Match, RoundRobinStanding, Tournament, TournamentConfig } from '@/types';

/**
 * Tournament configurations for different types
 */
export const TOURNAMENT_CONFIGS: Record<4 | 6 | 8 | 12, TournamentConfig> = {
  4: {
    type: 4,
    requiredPlayers: 8,
    teamsCount: 4,
    useGroups: false,
    advanceToKnockout: 4,
    description: '4 teams (8 players) - Round robin, then 1vs2 and 3vs4 semifinals',
  },
  6: {
    type: 6,
    requiredPlayers: 12,
    teamsCount: 6,
    useGroups: false,
    advanceToKnockout: 0,
    description: '6 teams (12 players) - Round robin only, all teams play each other',
  },
  8: {
    type: 8,
    requiredPlayers: 16,
    teamsCount: 8,
    useGroups: true,
    groupCount: 2,
    advanceToKnockout: 8,
    description: '8 teams (16 players) - 2 groups of 4, crossover knockouts, final and 3rd/4th place',
  },
  12: {
    type: 12,
    requiredPlayers: 24,
    teamsCount: 12,
    useGroups: true,
    groupCount: 3,
    advanceToKnockout: 12,
    description: '12 teams (24 players) - 3 groups of 4, split into winners/middle/losers brackets',
  },
};

/**
 * Generate teams by pairing players sequentially
 */
export function generateTeams(playerIds: string[], tournamentType: 4 | 6 | 8 | 12): Team[] {
  const config = TOURNAMENT_CONFIGS[tournamentType];
  const teams: Team[] = [];

  // Shuffle players to randomize pairings
  const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

  // Pair players sequentially: [0,1], [2,3], [4,5], etc.
  for (let i = 0; i < config.teamsCount * 2; i += 2) {
    teams.push({
      player1Id: shuffledPlayers[i],
      player2Id: shuffledPlayers[i + 1],
    });
  }

  return teams;
}

/**
 * Generate round robin matches (all teams play each other once)
 */
export function generateRoundRobinMatches(
  tournamentId: string,
  teams: Team[],
  useGroups: boolean = false,
  groupCount?: number
): Match[] {
  const matches: Match[] = [];

  if (useGroups && groupCount === 2 && teams.length === 8) {
    // Split into 2 groups of 4 teams
    const groupA = teams.slice(0, 4);
    const groupB = teams.slice(4, 8);

    // Generate matches for Group A
    for (let i = 0; i < groupA.length; i++) {
      for (let j = i + 1; j < groupA.length; j++) {
        matches.push({
          id: `${tournamentId}-rr-a-${i}-${j}`,
          tournamentId,
          team1: groupA[i],
          team2: groupA[j],
          stage: 'round_robin',
          group: 'A',
          completed: false,
        });
      }
    }

    // Generate matches for Group B
    for (let i = 0; i < groupB.length; i++) {
      for (let j = i + 1; j < groupB.length; j++) {
        matches.push({
          id: `${tournamentId}-rr-b-${i}-${j}`,
          tournamentId,
          team1: groupB[i],
          team2: groupB[j],
          stage: 'round_robin',
          group: 'B',
          completed: false,
        });
      }
    }
  } else if (useGroups && groupCount === 3 && teams.length === 12) {
    // Split into 3 groups of 4 teams
    const groupA = teams.slice(0, 4);
    const groupB = teams.slice(4, 8);
    const groupC = teams.slice(8, 12);

    // Generate matches for Group A
    for (let i = 0; i < groupA.length; i++) {
      for (let j = i + 1; j < groupA.length; j++) {
        matches.push({
          id: `${tournamentId}-rr-a-${i}-${j}`,
          tournamentId,
          team1: groupA[i],
          team2: groupA[j],
          stage: 'round_robin',
          group: 'A',
          completed: false,
        });
      }
    }

    // Generate matches for Group B
    for (let i = 0; i < groupB.length; i++) {
      for (let j = i + 1; j < groupB.length; j++) {
        matches.push({
          id: `${tournamentId}-rr-b-${i}-${j}`,
          tournamentId,
          team1: groupB[i],
          team2: groupB[j],
          stage: 'round_robin',
          group: 'B',
          completed: false,
        });
      }
    }

    // Generate matches for Group C
    for (let i = 0; i < groupC.length; i++) {
      for (let j = i + 1; j < groupC.length; j++) {
        matches.push({
          id: `${tournamentId}-rr-c-${i}-${j}`,
          tournamentId,
          team1: groupC[i],
          team2: groupC[j],
          stage: 'round_robin',
          group: 'C',
          completed: false,
        });
      }
    }
  } else {
    // Regular round robin - all teams play each other
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          id: `${tournamentId}-rr-${i}-${j}`,
          tournamentId,
          team1: teams[i],
          team2: teams[j],
          stage: 'round_robin',
          completed: false,
        });
      }
    }
  }

  return matches;
}

/**
 * Get team key for standings tracking
 */
export function getTeamKey(team: Team): string {
  const players = [team.player1Id, team.player2Id].sort();
  return players.join('-');
}

/**
 * Calculate round robin standings, optionally by group
 */
export function calculateRoundRobinStandings(
  matches: Match[],
  group?: 'A' | 'B' | 'C'
): RoundRobinStanding[] {
  // Filter matches by group if specified
  const relevantMatches = group
    ? matches.filter(m => m.group === group)
    : matches;
  const standingsMap = new Map<string, RoundRobinStanding>();

  // Initialize standings for all teams
  relevantMatches.forEach(match => {
    [match.team1, match.team2].forEach(team => {
      const key = getTeamKey(team);
      if (!standingsMap.has(key)) {
        standingsMap.set(key, {
          teamKey: key,
          player1Id: team.player1Id,
          player2Id: team.player2Id,
          wins: 0,
          losses: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
          points: 0,
        });
      }
    });
  });

  // Calculate stats from completed matches
  relevantMatches.forEach(match => {
    if (!match.completed || !match.score) return;

    const team1Key = getTeamKey(match.team1);
    const team2Key = getTeamKey(match.team2);
    const team1Standing = standingsMap.get(team1Key)!;
    const team2Standing = standingsMap.get(team2Key)!;

    // Update sets
    team1Standing.setsWon += match.score.team1Sets;
    team1Standing.setsLost += match.score.team2Sets;
    team2Standing.setsWon += match.score.team2Sets;
    team2Standing.setsLost += match.score.team1Sets;

    // Update games
    match.score.sets.forEach(set => {
      team1Standing.gamesWon += set.team1Games;
      team1Standing.gamesLost += set.team2Games;
      team2Standing.gamesWon += set.team2Games;
      team2Standing.gamesLost += set.team1Games;
    });

    // Update wins/losses
    if (match.score.team1Sets > match.score.team2Sets) {
      team1Standing.wins++;
      team2Standing.losses++;
    } else {
      team2Standing.wins++;
      team1Standing.losses++;
    }
  });

  // Calculate points (3 for win, 0 for loss)
  standingsMap.forEach(standing => {
    standing.points = standing.wins * 3;
  });

  // Sort standings
  const standings = Array.from(standingsMap.values());
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    const aGameDiff = a.gamesWon - a.gamesLost;
    const bGameDiff = b.gamesWon - b.gamesLost;
    return bGameDiff - aGameDiff;
  });

  return standings;
}

/**
 * Generate knockout stage matches based on round robin standings and tournament type
 */
export function generateKnockoutMatches(
  tournamentId: string,
  standings: RoundRobinStanding[],
  tournamentType: 4 | 6 | 8 | 12,
  groupAStandings?: RoundRobinStanding[],
  groupBStandings?: RoundRobinStanding[],
  groupCStandings?: RoundRobinStanding[]
): Match[] {
  const matches: Match[] = [];

  if (tournamentType === 4) {
    // 4 teams (8 players): Round robin then semifinals (1vs2, 3vs4)
    if (standings.length < 4) return matches;

    const topTeams = standings.slice(0, 4);

    // Semifinal 1: 1st vs 2nd
    matches.push({
      id: `${tournamentId}-sf-1`,
      tournamentId,
      team1: { player1Id: topTeams[0].player1Id, player2Id: topTeams[0].player2Id },
      team2: { player1Id: topTeams[1].player1Id, player2Id: topTeams[1].player2Id },
      stage: 'semi_final',
      completed: false,
    });

    // Semifinal 2: 3rd vs 4th
    matches.push({
      id: `${tournamentId}-sf-2`,
      tournamentId,
      team1: { player1Id: topTeams[2].player1Id, player2Id: topTeams[2].player2Id },
      team2: { player1Id: topTeams[3].player1Id, player2Id: topTeams[3].player2Id },
      stage: 'semi_final',
      completed: false,
    });
  } else if (tournamentType === 6) {
    // 6 teams (12 players): Round robin only, NO knockout stage
    return matches;
  } else if (tournamentType === 8) {
    // 8 teams (16 players): 2 groups, crossover knockouts
    if (!groupAStandings || !groupBStandings) return matches;
    if (groupAStandings.length < 4 || groupBStandings.length < 4) return matches;

    const groupA = groupAStandings.slice(0, 4);
    const groupB = groupBStandings.slice(0, 4);

    // Crossover quarterfinals
    // Match 1: 1A vs 2B
    matches.push({
      id: `${tournamentId}-qf-1`,
      tournamentId,
      team1: { player1Id: groupA[0].player1Id, player2Id: groupA[0].player2Id },
      team2: { player1Id: groupB[1].player1Id, player2Id: groupB[1].player2Id },
      stage: 'quarter_final',
      completed: false,
    });

    // Match 2: 1B vs 2A
    matches.push({
      id: `${tournamentId}-qf-2`,
      tournamentId,
      team1: { player1Id: groupB[0].player1Id, player2Id: groupB[0].player2Id },
      team2: { player1Id: groupA[1].player1Id, player2Id: groupA[1].player2Id },
      stage: 'quarter_final',
      completed: false,
    });

    // Match 3: 3A vs 4B
    matches.push({
      id: `${tournamentId}-qf-3`,
      tournamentId,
      team1: { player1Id: groupA[2].player1Id, player2Id: groupA[2].player2Id },
      team2: { player1Id: groupB[3].player1Id, player2Id: groupB[3].player2Id },
      stage: 'quarter_final',
      completed: false,
    });

    // Match 4: 3B vs 4A
    matches.push({
      id: `${tournamentId}-qf-4`,
      tournamentId,
      team1: { player1Id: groupB[2].player1Id, player2Id: groupB[2].player2Id },
      team2: { player1Id: groupA[3].player1Id, player2Id: groupA[3].player2Id },
      stage: 'quarter_final',
      completed: false,
    });
  } else if (tournamentType === 12) {
    // 12 teams (24 players): 3 groups of 4, complex bracket system
    if (!groupAStandings || !groupBStandings || !groupCStandings) return matches;
    if (groupAStandings.length < 4 || groupBStandings.length < 4 || groupCStandings.length < 4) return matches;

    // Get standings for each position
    const firsts = [groupAStandings[0], groupBStandings[0], groupCStandings[0]];
    const seconds = [groupAStandings[1], groupBStandings[1], groupCStandings[1]];
    const thirds = [groupAStandings[2], groupBStandings[2], groupCStandings[2]];
    const fourths = [groupAStandings[3], groupBStandings[3], groupCStandings[3]];

    // Sort to find best teams
    const sortedFirsts = [...firsts].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      const aGameDiff = a.gamesWon - a.gamesLost;
      const bGameDiff = b.gamesWon - b.gamesLost;
      return bGameDiff - aGameDiff;
    });

    const sortedSeconds = [...seconds].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      const aGameDiff = a.gamesWon - a.gamesLost;
      const bGameDiff = b.gamesWon - b.gamesLost;
      return bGameDiff - aGameDiff;
    });

    const sortedThirds = [...thirds].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      const aGameDiff = a.gamesWon - a.gamesLost;
      const bGameDiff = b.gamesWon - b.gamesLost;
      return bGameDiff - aGameDiff;
    });

    // WINNERS BRACKET (1st-4th place): 3 group winners + best 2nd
    const winnersBracket = [...sortedFirsts, sortedSeconds[0]];

    // Semifinal 1: Best 1st vs 2nd best 2nd
    matches.push({
      id: `${tournamentId}-winners-sf-1`,
      tournamentId,
      team1: { player1Id: winnersBracket[0].player1Id, player2Id: winnersBracket[0].player2Id },
      team2: { player1Id: winnersBracket[3].player1Id, player2Id: winnersBracket[3].player2Id },
      stage: 'bracket_semi',
      bracket: 'winners',
      completed: false,
    });

    // Semifinal 2: 2nd best 1st vs 3rd best 1st
    matches.push({
      id: `${tournamentId}-winners-sf-2`,
      tournamentId,
      team1: { player1Id: winnersBracket[1].player1Id, player2Id: winnersBracket[1].player2Id },
      team2: { player1Id: winnersBracket[2].player1Id, player2Id: winnersBracket[2].player2Id },
      stage: 'bracket_semi',
      bracket: 'winners',
      completed: false,
    });

    // MIDDLE BRACKET (5th-8th place): Other 2 second places + 2 best 3rds
    const middleBracket = [sortedSeconds[1], sortedSeconds[2], sortedThirds[0], sortedThirds[1]];

    // Semifinal 1
    matches.push({
      id: `${tournamentId}-middle-sf-1`,
      tournamentId,
      team1: { player1Id: middleBracket[0].player1Id, player2Id: middleBracket[0].player2Id },
      team2: { player1Id: middleBracket[3].player1Id, player2Id: middleBracket[3].player2Id },
      stage: 'bracket_semi',
      bracket: 'middle',
      completed: false,
    });

    // Semifinal 2
    matches.push({
      id: `${tournamentId}-middle-sf-2`,
      tournamentId,
      team1: { player1Id: middleBracket[1].player1Id, player2Id: middleBracket[1].player2Id },
      team2: { player1Id: middleBracket[2].player1Id, player2Id: middleBracket[2].player2Id },
      stage: 'bracket_semi',
      bracket: 'middle',
      completed: false,
    });

    // LOSERS BRACKET (9th-12th place): Worst 3rd + all 4ths
    const losersBracket = [sortedThirds[2], ...fourths];

    // Semifinal 1
    matches.push({
      id: `${tournamentId}-losers-sf-1`,
      tournamentId,
      team1: { player1Id: losersBracket[0].player1Id, player2Id: losersBracket[0].player2Id },
      team2: { player1Id: losersBracket[3].player1Id, player2Id: losersBracket[3].player2Id },
      stage: 'bracket_semi',
      bracket: 'losers',
      completed: false,
    });

    // Semifinal 2
    matches.push({
      id: `${tournamentId}-losers-sf-2`,
      tournamentId,
      team1: { player1Id: losersBracket[1].player1Id, player2Id: losersBracket[1].player2Id },
      team2: { player1Id: losersBracket[2].player1Id, player2Id: losersBracket[2].player2Id },
      stage: 'bracket_semi',
      bracket: 'losers',
      completed: false,
    });
  }

  return matches;
}

/**
 * Generate finals match from semi-final winners
 */
export function generateFinalMatch(
  tournamentId: string,
  semiFinal1: Match,
  semiFinal2: Match
): Match | null {
  if (!semiFinal1.completed || !semiFinal2.completed || !semiFinal1.score || !semiFinal2.score) {
    return null;
  }

  const sf1Winner = semiFinal1.score.team1Sets > semiFinal1.score.team2Sets
    ? semiFinal1.team1
    : semiFinal1.team2;

  const sf2Winner = semiFinal2.score.team1Sets > semiFinal2.score.team2Sets
    ? semiFinal2.team1
    : semiFinal2.team2;

  return {
    id: `${tournamentId}-final`,
    tournamentId,
    team1: sf1Winner,
    team2: sf2Winner,
    stage: 'final',
    completed: false,
  };
}

/**
 * Calculate tournament points for a player
 */
export function calculatePlayerTournamentPoints(
  playerId: string,
  tournament: Tournament,
  standings: RoundRobinStanding[]
): number {
  let points = tournament.pointsDistribution.participation;

  // Round robin wins
  const playerStanding = standings.find(
    s => s.player1Id === playerId || s.player2Id === playerId
  );
  if (playerStanding) {
    points += playerStanding.wins * tournament.pointsDistribution.roundRobinWin;
  }

  // Knockout stage points
  if (tournament.knockoutMatches && tournament.knockoutMatches.length > 0) {
    const finals = tournament.knockoutMatches.filter(m => m.stage === 'final');
    const semiFinals = tournament.knockoutMatches.filter(m => m.stage === 'semi_final');

    // Check if player won the tournament
    if (finals.length > 0 && finals[0].completed && finals[0].score) {
      const winner = finals[0].score.team1Sets > finals[0].score.team2Sets
        ? finals[0].team1
        : finals[0].team2;

      const runnerUp = finals[0].score.team1Sets > finals[0].score.team2Sets
        ? finals[0].team2
        : finals[0].team1;

      if (winner.player1Id === playerId || winner.player2Id === playerId) {
        points += tournament.pointsDistribution.winner;
      } else if (runnerUp.player1Id === playerId || runnerUp.player2Id === playerId) {
        points += tournament.pointsDistribution.runnerUp;
      }
    }

    // Check if player reached semi-finals
    semiFinals.forEach(sf => {
      if (sf.completed && sf.score) {
        const loser = sf.score.team1Sets < sf.score.team2Sets ? sf.team1 : sf.team2;
        if (loser.player1Id === playerId || loser.player2Id === playerId) {
          points += tournament.pointsDistribution.semiFinal;
        }
      }
    });
  }

  return points;
}

/**
 * Default points distribution
 */
export const DEFAULT_POINTS_DISTRIBUTION = {
  winner: 100,
  runnerUp: 60,
  semiFinal: 30,
  quarterFinal: 15,
  roundRobinWin: 5,
  participation: 10,
};
