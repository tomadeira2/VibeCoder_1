import { NextRequest, NextResponse } from 'next/server';
import { getTournamentById, updateTournament, getPlayers, updatePlayer } from '@/lib/storage';
import { Match, Player } from '@/types';
import {
  calculateRoundRobinStandings,
  generateKnockoutMatches,
  generateFinalMatch,
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
        // For 8-team tournaments, calculate group standings separately
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
      } else if (tournament.type === 12) {
        // For 12-team tournaments, calculate group standings for all 3 groups
        const groupAStandings = calculateRoundRobinStandings(tournament.roundRobinMatches, 'A');
        const groupBStandings = calculateRoundRobinStandings(tournament.roundRobinMatches, 'B');
        const groupCStandings = calculateRoundRobinStandings(tournament.roundRobinMatches, 'C');
        const knockoutMatches = generateKnockoutMatches(
          tournament.id,
          [],
          tournament.type,
          groupAStandings,
          groupBStandings,
          groupCStandings
        );
        tournament.knockoutMatches = knockoutMatches;
      } else if (tournament.type === 4) {
        // For 4-team tournaments
        const standings = calculateRoundRobinStandings(tournament.roundRobinMatches);
        const knockoutMatches = generateKnockoutMatches(
          tournament.id,
          standings,
          tournament.type
        );
        tournament.knockoutMatches = knockoutMatches;
      } else if (tournament.type === 6) {
        // For 6-team tournaments, no knockout stage
        tournament.knockoutMatches = [];
        tournament.status = 'in_progress';
      }

      if (tournament.type !== 6) {
        tournament.status = 'in_progress';
      }
    }

    // Generate finals and third-place matches based on tournament type
    if (tournament.type === 4) {
      // For 4 teams: Check if both semifinals are complete
      const semifinals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'semi_final');
      if (semifinals.length === 2 && semifinals.every((m: Match) => m.completed)) {
        const finals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'final' || m.stage === 'third_place');

        if (finals.length === 0) {
          // Generate final and third place matches
          const sf1Winner = semifinals[0].score!.team1Sets > semifinals[0].score!.team2Sets
            ? semifinals[0].team1
            : semifinals[0].team2;
          const sf1Loser = semifinals[0].score!.team1Sets > semifinals[0].score!.team2Sets
            ? semifinals[0].team2
            : semifinals[0].team1;
          const sf2Winner = semifinals[1].score!.team1Sets > semifinals[1].score!.team2Sets
            ? semifinals[1].team1
            : semifinals[1].team2;
          const sf2Loser = semifinals[1].score!.team1Sets > semifinals[1].score!.team2Sets
            ? semifinals[1].team2
            : semifinals[1].team1;

          tournament.knockoutMatches.push({
            id: `${tournament.id}-final`,
            tournamentId: tournament.id,
            team1: sf1Winner,
            team2: sf2Winner,
            stage: 'final',
            completed: false,
          });

          tournament.knockoutMatches.push({
            id: `${tournament.id}-third-place`,
            tournamentId: tournament.id,
            team1: sf1Loser,
            team2: sf2Loser,
            stage: 'third_place',
            completed: false,
          });
        }
      }
    } else if (tournament.type === 8) {
      // For 8 teams: Check if all quarterfinals are complete
      const quarterfinals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'quarter_final');
      if (quarterfinals.length === 4 && quarterfinals.every((m: Match) => m.completed)) {
        const semifinals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'semi_final');

        if (semifinals.length === 0) {
          // Generate semifinals from quarterfinal winners
          const qf1Winner = quarterfinals[0].score!.team1Sets > quarterfinals[0].score!.team2Sets
            ? quarterfinals[0].team1
            : quarterfinals[0].team2;
          const qf2Winner = quarterfinals[1].score!.team1Sets > quarterfinals[1].score!.team2Sets
            ? quarterfinals[1].team1
            : quarterfinals[1].team2;
          const qf3Winner = quarterfinals[2].score!.team1Sets > quarterfinals[2].score!.team2Sets
            ? quarterfinals[2].team1
            : quarterfinals[2].team2;
          const qf4Winner = quarterfinals[3].score!.team1Sets > quarterfinals[3].score!.team2Sets
            ? quarterfinals[3].team1
            : quarterfinals[3].team2;

          tournament.knockoutMatches.push({
            id: `${tournament.id}-sf-1`,
            tournamentId: tournament.id,
            team1: qf1Winner,
            team2: qf2Winner,
            stage: 'semi_final',
            completed: false,
          });

          tournament.knockoutMatches.push({
            id: `${tournament.id}-sf-2`,
            tournamentId: tournament.id,
            team1: qf3Winner,
            team2: qf4Winner,
            stage: 'semi_final',
            completed: false,
          });
        }
      }

      // Check if semifinals are complete
      const semifinals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'semi_final');
      if (semifinals.length === 2 && semifinals.every((m: Match) => m.completed)) {
        const finals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'final' || m.stage === 'third_place');

        if (finals.length === 0) {
          // Generate final and third place matches
          const sf1Winner = semifinals[0].score!.team1Sets > semifinals[0].score!.team2Sets
            ? semifinals[0].team1
            : semifinals[0].team2;
          const sf1Loser = semifinals[0].score!.team1Sets > semifinals[0].score!.team2Sets
            ? semifinals[0].team2
            : semifinals[0].team1;
          const sf2Winner = semifinals[1].score!.team1Sets > semifinals[1].score!.team2Sets
            ? semifinals[1].team1
            : semifinals[1].team2;
          const sf2Loser = semifinals[1].score!.team1Sets > semifinals[1].score!.team2Sets
            ? semifinals[1].team2
            : semifinals[1].team1;

          tournament.knockoutMatches.push({
            id: `${tournament.id}-final`,
            tournamentId: tournament.id,
            team1: sf1Winner,
            team2: sf2Winner,
            stage: 'final',
            completed: false,
          });

          tournament.knockoutMatches.push({
            id: `${tournament.id}-third-place`,
            tournamentId: tournament.id,
            team1: sf1Loser,
            team2: sf2Loser,
            stage: 'third_place',
            completed: false,
          });
        }
      }
    } else if (tournament.type === 12) {
      // For 12 teams: Check bracket semifinals
      const winnersSemis = tournament.knockoutMatches.filter(
        (m: Match) => m.stage === 'bracket_semi' && m.bracket === 'winners'
      );
      const middleSemis = tournament.knockoutMatches.filter(
        (m: Match) => m.stage === 'bracket_semi' && m.bracket === 'middle'
      );
      const losersSemis = tournament.knockoutMatches.filter(
        (m: Match) => m.stage === 'bracket_semi' && m.bracket === 'losers'
      );

      // Generate bracket finals for each bracket
      if (winnersSemis.length === 2 && winnersSemis.every((m: Match) => m.completed)) {
        const winnersFinals = tournament.knockoutMatches.filter(
          (m: Match) => m.stage === 'bracket_final' && m.bracket === 'winners'
        );
        if (winnersFinals.length === 0) {
          const ws1Winner = winnersSemis[0].score!.team1Sets > winnersSemis[0].score!.team2Sets
            ? winnersSemis[0].team1
            : winnersSemis[0].team2;
          const ws1Loser = winnersSemis[0].score!.team1Sets > winnersSemis[0].score!.team2Sets
            ? winnersSemis[0].team2
            : winnersSemis[0].team1;
          const ws2Winner = winnersSemis[1].score!.team1Sets > winnersSemis[1].score!.team2Sets
            ? winnersSemis[1].team1
            : winnersSemis[1].team2;
          const ws2Loser = winnersSemis[1].score!.team1Sets > winnersSemis[1].score!.team2Sets
            ? winnersSemis[1].team2
            : winnersSemis[1].team1;

          // Final for 1st place
          tournament.knockoutMatches.push({
            id: `${tournament.id}-winners-final`,
            tournamentId: tournament.id,
            team1: ws1Winner,
            team2: ws2Winner,
            stage: 'bracket_final',
            bracket: 'winners',
            completed: false,
          });

          // Third place match
          tournament.knockoutMatches.push({
            id: `${tournament.id}-winners-third`,
            tournamentId: tournament.id,
            team1: ws1Loser,
            team2: ws2Loser,
            stage: 'third_place',
            bracket: 'winners',
            completed: false,
          });
        }
      }

      if (middleSemis.length === 2 && middleSemis.every((m: Match) => m.completed)) {
        const middleFinals = tournament.knockoutMatches.filter(
          (m: Match) => m.stage === 'bracket_final' && m.bracket === 'middle'
        );
        if (middleFinals.length === 0) {
          const ms1Winner = middleSemis[0].score!.team1Sets > middleSemis[0].score!.team2Sets
            ? middleSemis[0].team1
            : middleSemis[0].team2;
          const ms1Loser = middleSemis[0].score!.team1Sets > middleSemis[0].score!.team2Sets
            ? middleSemis[0].team2
            : middleSemis[0].team1;
          const ms2Winner = middleSemis[1].score!.team1Sets > middleSemis[1].score!.team2Sets
            ? middleSemis[1].team1
            : middleSemis[1].team2;
          const ms2Loser = middleSemis[1].score!.team1Sets > middleSemis[1].score!.team2Sets
            ? middleSemis[1].team2
            : middleSemis[1].team1;

          // Final for 5th place
          tournament.knockoutMatches.push({
            id: `${tournament.id}-middle-final`,
            tournamentId: tournament.id,
            team1: ms1Winner,
            team2: ms2Winner,
            stage: 'bracket_final',
            bracket: 'middle',
            completed: false,
          });

          // 7th place match
          tournament.knockoutMatches.push({
            id: `${tournament.id}-middle-third`,
            tournamentId: tournament.id,
            team1: ms1Loser,
            team2: ms2Loser,
            stage: 'third_place',
            bracket: 'middle',
            completed: false,
          });
        }
      }

      if (losersSemis.length === 2 && losersSemis.every((m: Match) => m.completed)) {
        const losersFinals = tournament.knockoutMatches.filter(
          (m: Match) => m.stage === 'bracket_final' && m.bracket === 'losers'
        );
        if (losersFinals.length === 0) {
          const ls1Winner = losersSemis[0].score!.team1Sets > losersSemis[0].score!.team2Sets
            ? losersSemis[0].team1
            : losersSemis[0].team2;
          const ls1Loser = losersSemis[0].score!.team1Sets > losersSemis[0].score!.team2Sets
            ? losersSemis[0].team2
            : losersSemis[0].team1;
          const ls2Winner = losersSemis[1].score!.team1Sets > losersSemis[1].score!.team2Sets
            ? losersSemis[1].team1
            : losersSemis[1].team2;
          const ls2Loser = losersSemis[1].score!.team1Sets > losersSemis[1].score!.team2Sets
            ? losersSemis[1].team2
            : losersSemis[1].team1;

          // Final for 9th place
          tournament.knockoutMatches.push({
            id: `${tournament.id}-losers-final`,
            tournamentId: tournament.id,
            team1: ls1Winner,
            team2: ls2Winner,
            stage: 'bracket_final',
            bracket: 'losers',
            completed: false,
          });

          // 11th place match
          tournament.knockoutMatches.push({
            id: `${tournament.id}-losers-third`,
            tournamentId: tournament.id,
            team1: ls1Loser,
            team2: ls2Loser,
            stage: 'third_place',
            bracket: 'losers',
            completed: false,
          });
        }
      }
    }

    // Check if tournament is complete
    let tournamentComplete = false;

    if (tournament.type === 6) {
      // For 6 teams, tournament is complete when all round robin matches are done
      tournamentComplete = allRRComplete;
    } else if (tournament.type === 12) {
      // For 12 teams, tournament is complete when all bracket finals are done
      const winnersFinal = tournament.knockoutMatches.filter(
        (m: Match) => m.stage === 'bracket_final' && m.bracket === 'winners'
      );
      const middleFinal = tournament.knockoutMatches.filter(
        (m: Match) => m.stage === 'bracket_final' && m.bracket === 'middle'
      );
      const losersFinal = tournament.knockoutMatches.filter(
        (m: Match) => m.stage === 'bracket_final' && m.bracket === 'losers'
      );

      tournamentComplete =
        winnersFinal.length > 0 && winnersFinal[0].completed &&
        middleFinal.length > 0 && middleFinal[0].completed &&
        losersFinal.length > 0 && losersFinal[0].completed;
    } else {
      // For 4 and 8 teams, tournament is complete when the final is done
      const finals = tournament.knockoutMatches.filter((m: Match) => m.stage === 'final');
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
