'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Tournament, Player, Match, RoundRobinStanding } from '@/types';
import { calculateRoundRobinStandings } from '@/lib/tournament';

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<RoundRobinStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const fetchTournamentData = async () => {
    try {
      const [tournamentRes, playersRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch('/api/players'),
      ]);

      const tournamentData = await tournamentRes.json();
      const playersData = await playersRes.json();

      setTournament(tournamentData);
      setPlayers(playersData);

      if (tournamentData.roundRobinMatches.length > 0) {
        const calculatedStandings = calculateRoundRobinStandings(tournamentData.roundRobinMatches);
        setStandings(calculatedStandings);
      }
    } catch (error) {
      console.error('Failed to fetch tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const updateMatchScore = async (matchId: string, stage: string) => {
    const sets = prompt('Enter score (format: team1Sets-team2Sets, e.g., 2-1):');
    if (!sets) return;

    const [team1Sets, team2Sets] = sets.split('-').map(Number);
    if (isNaN(team1Sets) || isNaN(team2Sets)) {
      alert('Invalid score format');
      return;
    }

    const setScores = [];
    for (let i = 0; i < team1Sets + team2Sets; i++) {
      const setScore = prompt(`Enter set ${i + 1} score (format: team1Games-team2Games, e.g., 6-4):`);
      if (!setScore) return;

      const [team1Games, team2Games] = setScore.split('-').map(Number);
      if (isNaN(team1Games) || isNaN(team2Games)) {
        alert('Invalid set score format');
        return;
      }

      setScores.push({ team1Games, team2Games });
    }

    try {
      await fetch(`/api/tournaments/${id}/matches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          stage,
          score: {
            team1Sets,
            team2Sets,
            sets: setScores,
          },
        }),
      });

      fetchTournamentData();
    } catch (error) {
      console.error('Failed to update match score:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="text-center py-8">Tournament not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/tournaments" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Tournaments
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(tournament.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded font-medium ${
              tournament.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : tournament.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {tournament.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Round Robin Standings */}
      {standings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Round Robin Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-4 py-2 text-center">W</th>
                  <th className="px-4 py-2 text-center">L</th>
                  <th className="px-4 py-2 text-center">Sets</th>
                  <th className="px-4 py-2 text-center">Games</th>
                  <th className="px-4 py-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {standings.map((standing, index) => (
                  <tr key={standing.teamKey} className={index < 4 ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      {getPlayerName(standing.player1Id)} / {getPlayerName(standing.player2Id)}
                    </td>
                    <td className="px-4 py-2 text-center">{standing.wins}</td>
                    <td className="px-4 py-2 text-center">{standing.losses}</td>
                    <td className="px-4 py-2 text-center">
                      {standing.setsWon}-{standing.setsLost}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {standing.gamesWon}-{standing.gamesLost}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {standings.length >= 4 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Top 4 teams advance to knockout stage
            </p>
          )}
        </div>
      )}

      {/* Round Robin Matches */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Round Robin Matches</h2>
        <div className="space-y-3">
          {tournament.roundRobinMatches.map((match: Match) => (
            <div
              key={match.id}
              className="border rounded p-4 dark:border-gray-700 flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {getPlayerName(match.team1.player1Id)} / {getPlayerName(match.team1.player2Id)}
                </div>
                <div className="text-sm text-gray-500">vs</div>
                <div className="font-medium">
                  {getPlayerName(match.team2.player1Id)} / {getPlayerName(match.team2.player2Id)}
                </div>
              </div>
              <div className="text-center min-w-[100px]">
                {match.completed && match.score ? (
                  <div className="text-lg font-bold">
                    {match.score.team1Sets} - {match.score.team2Sets}
                  </div>
                ) : (
                  <button
                    onClick={() => updateMatchScore(match.id, 'round_robin')}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Enter Score
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knockout Matches */}
      {tournament.knockoutMatches && tournament.knockoutMatches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Knockout Stage</h2>

          {['semi_final', 'final'].map((stage) => {
            const matches = tournament.knockoutMatches.filter((m: Match) => m.stage === stage);
            if (matches.length === 0) return null;

            return (
              <div key={stage} className="mb-6">
                <h3 className="text-xl font-semibold mb-3 capitalize">
                  {stage.replace('_', ' ')}
                </h3>
                <div className="space-y-3">
                  {matches.map((match: Match) => (
                    <div
                      key={match.id}
                      className="border-2 border-blue-200 dark:border-blue-800 rounded p-4 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {getPlayerName(match.team1.player1Id)} / {getPlayerName(match.team1.player2Id)}
                        </div>
                        <div className="text-sm text-gray-500">vs</div>
                        <div className="font-medium">
                          {getPlayerName(match.team2.player1Id)} / {getPlayerName(match.team2.player2Id)}
                        </div>
                      </div>
                      <div className="text-center min-w-[100px]">
                        {match.completed && match.score ? (
                          <div className="text-lg font-bold">
                            {match.score.team1Sets} - {match.score.team2Sets}
                          </div>
                        ) : (
                          <button
                            onClick={() => updateMatchScore(match.id, stage)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Enter Score
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
