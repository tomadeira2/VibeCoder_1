'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ranking } from '@/types';

export default function RankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await fetch('/api/rankings');
      const data = await response.json();
      setRankings(data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Global Rankings</h1>

      {rankings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500">
          No rankings yet. Complete some tournaments to see rankings!
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Points
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tournaments
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  W/L Record
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rankings.map((ranking) => {
                const totalMatches = ranking.wins + ranking.losses;
                const winRate = totalMatches > 0 ? (ranking.wins / totalMatches) * 100 : 0;

                return (
                  <tr
                    key={ranking.playerId}
                    className={
                      ranking.rank <= 3
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-2xl font-bold">
                        {getRankDisplay(ranking.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/players/${ranking.playerId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {ranking.playerName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {ranking.totalPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {ranking.tournamentsPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-green-600 font-semibold">{ranking.wins}</span>
                      {' / '}
                      <span className="text-red-600 font-semibold">{ranking.losses}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${winRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {winRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Points System</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-2">Tournament Placement:</p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>🥇 Winner: 100 points</li>
              <li>🥈 Runner-up: 60 points</li>
              <li>Semi-final: 30 points</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Round Robin:</p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>Win: 5 points</li>
              <li>Participation: 10 points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
