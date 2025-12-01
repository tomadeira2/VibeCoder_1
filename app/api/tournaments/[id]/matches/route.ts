import { NextRequest, NextResponse } from 'next/server';
import { getTournamentById, updateTournament, getPlayers, updatePlayer } from '@/lib/storage';
import { Match, Player } from '@/types';
import {
  calculateRoundRobinStandings,
  generateKnockoutMatches,
  generateFinalMatch,
  generatePlacementMatches,
  calculatePlayerTournamentPoints,
} from '@/lib/tournament';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { matchId, score, stage } = body;

    const tournament = await getTournamentById(id);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Update match score
    let matchArray = stage === 'round_robin' ? tournament.roundRobinMatches : tournament.knockoutMatches;
    const matchIndex = matchArray.findIndex((m: Match) => m.id === matchId);

    if (matchIndex === -1) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    matchArray[matchIndex].score = score;
    matchArray[matchIndex].completed = true;
    matchArray[matchIndex].playedAt = new Date().toISOString();

    // Check if all round robin matches are complete
    const allRRComplete = tournament.roundRobinMatches.every((m: Match) => m.completed);

    if (allRRComplete && tournament.knockoutMatches.length === 0) {
      // Generate knockout matches based on tournament type
      if (tournament.type === 8) {
        // For 8-player tournaments, calculate group standings separately
        const groupAStandings = calculateRoundRobinStandings(tournament.roundRobinMatches, 'A');
        const groupBStandings = calculateRoundRobinStandings(tournament.roundRobinMatches, 'B');
        const knockoutMatches = generateKnockoutMatches(
          tournament.id,
          [],
          tournament.type,
          groupAStandings,
          groupBStandings
        );
        tournament.knockoutMatches = knockoutMatches;
      } else {
        // For 4 and 6-player tournaments
        const standings = calculateRoundRobinStandings(tournament.roundRobinMatches);
        const knockoutMatches = generateKnockoutMatches(
          tournament.id,
          standings,
          tournament.type
        );
        tournament.knockoutMatches = knockoutMatches;
      }
      tournament.status = 'in_progress';
    }

    // Check if semi-finals are complete and generate finals/placement matches
    if (tournament.type === 6 && tournament.knockoutMatches.length === 2) {
      // For 6-player tournaments
      const allSFComplete = tournament.knockoutMatches.every((m: Match) => m.completed);
      if (allSFComplete) {
        const finalMatch = generateFinalMatch(
          tournament.id,
          tournament.knockoutMatches[0],
          tournament.knockoutMatches[1]
        );
        if (finalMatch) {
          tournament.knockoutMatches.push(finalMatch);
        }
      }
    } else if (tournament.type === 8 && tournament.knockoutMatches.length === 4) {
      // For 8-player tournaments with cross-bracket playoffs
      const semiFinals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'semi_final');
      const middleSemis = tournament.knockoutMatches.filter((m: Match) => m.stage === 'middle_semi');

      const newMatches = generatePlacementMatches(tournament.id, semiFinals, middleSemis);
      if (newMatches.length > 0) {
        tournament.knockoutMatches.push(...newMatches);
      }
    }

    // Check if tournament is complete
    const finals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'final');
    let tournamentComplete = false;

    if (tournament.type === 8) {
      // For 8-player tournaments, check if all placement matches are complete
      const placementStages = ['final', 'third_place', 'fifth_place', 'seventh_place'];
      const placementMatches = tournament.knockoutMatches.filter((m: Match) =>
        placementStages.includes(m.stage)
      );
      tournamentComplete = placementMatches.length === 4 && placementMatches.every((m: Match) => m.completed);
    } else {
      // For 4 and 6-player tournaments, just check if final is complete
      tournamentComplete = finals.length > 0 && finals[0].completed;
    }

    if (tournamentComplete) {
      tournament.status = 'completed';

      // Update player stats
      const players = await getPlayers();
      const standings = calculateRoundRobinStandings(tournament.roundRobinMatches);

      for (const playerId of tournament.playerIds) {
        const player = players.find((p: Player) => p.id === playerId);
        if (!player) continue;

        // Calculate points for this tournament
        const points = calculatePlayerTournamentPoints(playerId, tournament, standings);
        player.stats.totalPoints += points;
        player.stats.tournamentsPlayed += 1;

        // Update match stats
        tournament.roundRobinMatches.concat(tournament.knockoutMatches).forEach((match: Match) => {
          if (!match.completed || !match.score) return;

          const isInTeam1 = match.team1.player1Id === playerId || match.team1.player2Id === playerId;
          const isInTeam2 = match.team2.player1Id === playerId || match.team2.player2Id === playerId;

          if (!isInTeam1 && !isInTeam2) return;

          player.stats.matchesPlayed += 1;

          const team1Won = match.score.team1Sets > match.score.team2Sets;
          if ((isInTeam1 && team1Won) || (isInTeam2 && !team1Won)) {
            player.stats.matchesWon += 1;
          } else {
            player.stats.matchesLost += 1;
          }
        });

        await updatePlayer(player);
      }
    }

    await updateTournament(tournament);
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}
