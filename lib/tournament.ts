import { Player, Team, Match, RoundRobinStanding, Tournament, TournamentConfig } from '@/types';

/**
 * Tournament configurations for different types
 */
export const TOURNAMENT_CONFIGS: Record<4 | 6 | 8, TournamentConfig> = {
  4: {
    type: 4,
    requiredPlayers: 4,
    teamsCount: 6,
    useGroups: false,
    advanceToKnockout: 2,
    description: '4 players (6 teams) - Round robin, top 2 teams to final',
  },
  6: {
    type: 6,
    requiredPlayers: 6,
    teamsCount: 15,
    useGroups: false,
    advanceToKnockout: 4,
    description: '6 players (15 teams) - Round robin, top 4 teams to semi-finals',
  },
  8: {
    type: 8,
    requiredPlayers: 8,
    teamsCount: 12,
    useGroups: true,
    advanceToKnockout: 4,
    description: '8 players (12 teams in 2 brackets of 6) - Brackets, top 2 from each bracket to semi-finals',
  },
};

/**
 * Generate all unique team combinations from a list of players
 */
export function generateTeams(playerIds: string[], tournamentType: 4 | 6 | 8): Team[] {
  const config = TOURNAMENT_CONFIGS[tournamentType];
  const allTeams: Team[] = [];

  // Generate all possible teams
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      allTeams.push({
        player1Id: playerIds[i],
        player2Id: playerIds[j],
      });
    }
  }

  // For 8-player tournaments, select 12 teams (6 per bracket)
  if (tournamentType === 8) {
    // Shuffle and select 12 teams
    const shuffled = allTeams.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12);
  }

  return allTeams;
}

/**
 * Generate round robin matches (all teams play each other once)
 */
export function generateRoundRobinMatches(
  tournamentId: string,
  teams: Team[],
  useGroups: boolean = false
): Match[] {
  const matches: Match[] = [];

  if (useGroups && teams.length === 12) {
    // Split into 2 brackets of 6 teams each
    const groupA = teams.slice(0, 6);
    const groupB = teams.slice(6, 12);

    // Generate matches for Bracket A
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

    // Generate matches for Bracket B
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
  group?: 'A' | 'B'
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
  tournamentType: 4 | 6 | 8,
  groupAStandings?: RoundRobinStanding[],
  groupBStandings?: RoundRobinStanding[]
): Match[] {
  const matches: Match[] = [];
  const config = TOURNAMENT_CONFIGS[tournamentType];

  if (tournamentType === 4) {
    // 4 players: Top 2 teams go directly to final
    if (standings.length < 2) return matches;

    const topTeams = standings.slice(0, 2);
    matches.push({
      id: `${tournamentId}-final`,
      tournamentId,
      team1: { player1Id: topTeams[0].player1Id, player2Id: topTeams[0].player2Id },
      team2: { player1Id: topTeams[1].player1Id, player2Id: topTeams[1].player2Id },
      stage: 'final',
      completed: false,
    });
  } else if (tournamentType === 6) {
    // 6 players: Top 4 teams to semi-finals
    if (standings.length < 4) return matches;

    const topTeams = standings.slice(0, 4);

    // Semi-finals: 1st vs 4th, 2nd vs 3rd
    matches.push({
      id: `${tournamentId}-sf-1`,
      tournamentId,
      team1: { player1Id: topTeams[0].player1Id, player2Id: topTeams[0].player2Id },
      team2: { player1Id: topTeams[3].player1Id, player2Id: topTeams[3].player2Id },
      stage: 'semi_final',
      completed: false,
    });

    matches.push({
      id: `${tournamentId}-sf-2`,
      tournamentId,
      team1: { player1Id: topTeams[1].player1Id, player2Id: topTeams[1].player2Id },
      team2: { player1Id: topTeams[2].player1Id, player2Id: topTeams[2].player2Id },
      stage: 'semi_final',
      completed: false,
    });
  } else if (tournamentType === 8) {
    // 8 players with groups: Top 2 from each group to semi-finals
    if (!groupAStandings || !groupBStandings) return matches;
    if (groupAStandings.length < 2 || groupBStandings.length < 2) return matches;

    const groupATop2 = groupAStandings.slice(0, 2);
    const groupBTop2 = groupBStandings.slice(0, 2);

    // Semi-finals: A1 vs B2, B1 vs A2
    matches.push({
      id: `${tournamentId}-sf-1`,
      tournamentId,
      team1: { player1Id: groupATop2[0].player1Id, player2Id: groupATop2[0].player2Id },
      team2: { player1Id: groupBTop2[1].player1Id, player2Id: groupBTop2[1].player2Id },
      stage: 'semi_final',
      completed: false,
    });

    matches.push({
      id: `${tournamentId}-sf-2`,
      tournamentId,
      team1: { player1Id: groupBTop2[0].player1Id, player2Id: groupBTop2[0].player2Id },
      team2: { player1Id: groupATop2[1].player1Id, player2Id: groupATop2[1].player2Id },
      stage: 'semi_final',
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
