'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Player, Tournament } from '@/types';

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [player, setPlayer] = useState<Player | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      const [playerRes, tournamentsRes] = await Promise.all([
        fetch(`/api/players/${id}`),
        fetch('/api/tournaments'),
      ]);

      const playerData = await playerRes.json();
      const tournamentsData = await tournamentsRes.json();

      setPlayer(playerData);
      setTournaments(tournamentsData.filter((t: Tournament) =>
        t.playerIds.includes(id)
      ));
    } catch (error) {
      console.error('Failed to fetch player data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!player) {
    return <div className="text-center py-8">Player not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/players" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Players
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{player.email}</p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded">
            <h3 className="font-semibold mb-2">Total Points</h3>
            <p className="text-3xl font-bold text-blue-600">{player.stats.totalPoints}</p>
          </div>

          <div className="bg-green-50 dark:bg-gray-700 p-4 rounded">
            <h3 className="font-semibold mb-2">Tournaments Played</h3>
            <p className="text-3xl font-bold text-green-600">{player.stats.tournamentsPlayed}</p>
          </div>

          <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded">
            <h3 className="font-semibold mb-2">Matches Won</h3>
            <p className="text-3xl font-bold text-purple-600">{player.stats.matchesWon}</p>
          </div>

          <div className="bg-orange-50 dark:bg-gray-700 p-4 rounded">
            <h3 className="font-semibold mb-2">Matches Lost</h3>
            <p className="text-3xl font-bold text-orange-600">{player.stats.matchesLost}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Win Rate</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full"
              style={{
                width: `${player.stats.matchesPlayed > 0
                  ? (player.stats.matchesWon / player.stats.matchesPlayed) * 100
                  : 0}%`
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {player.stats.matchesPlayed > 0
              ? `${((player.stats.matchesWon / player.stats.matchesPlayed) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Tournament History</h2>

        {tournaments.length === 0 ? (
          <p className="text-gray-500">No tournaments played yet.</p>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="block p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{tournament.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(tournament.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    tournament.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tournament.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tournament.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
