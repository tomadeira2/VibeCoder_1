'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tournament, Player } from '@/types';
import { TOURNAMENT_CONFIGS } from '@/lib/tournament';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 4 as 4 | 6 | 8 | 12,
    playerIds: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tournamentsRes, playersRes] = await Promise.all([
        fetch('/api/tournaments'),
        fetch('/api/players'),
      ]);

      const tournamentsData = await tournamentsRes.json();
      const playersData = await playersRes.json();

      setTournaments(tournamentsData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const config = TOURNAMENT_CONFIGS[formData.type];
    if (formData.playerIds.length !== config.requiredPlayers) {
      alert(`Please select exactly ${config.requiredPlayers} players for this tournament type`);
      return;
    }

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', date: '', type: 4, playerIds: [] });
        setShowForm(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  const togglePlayer = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      playerIds: prev.playerIds.includes(playerId)
        ? prev.playerIds.filter(id => id !== playerId)
        : [...prev.playerIds, playerId],
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tournaments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={players.length < 8}
        >
          {showForm ? 'Cancel' : 'Create New Tournament'}
        </button>
      </div>

      {players.length < 8 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
          You need at least 8 registered players to create a 4-team tournament.
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Tournament</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Tournament Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Tournament Type</label>
              <div className="space-y-3">
                {([4, 6, 8, 12] as const).map((type) => {
                  const config = TOURNAMENT_CONFIGS[type];
                  const hasEnoughPlayers = players.length >= config.requiredPlayers;
                  return (
                    <label
                      key={type}
                      className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.type === type
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                      } ${!hasEnoughPlayers ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={formData.type === type}
                        onChange={(e) => setFormData({ ...formData, type: type, playerIds: [] })}
                        className="mt-1"
                        disabled={!hasEnoughPlayers}
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{config.requiredPlayers} Players Tournament ({type} teams)</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {config.description}
                        </div>
                        {!hasEnoughPlayers && (
                          <div className="text-sm text-red-600 mt-1">
                            Not enough players registered
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium">
                Select Players ({formData.playerIds.length} selected, need exactly {TOURNAMENT_CONFIGS[formData.type].requiredPlayers})
              </label>
              <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 border rounded dark:border-gray-600">
                {players.map((player) => {
                  const config = TOURNAMENT_CONFIGS[formData.type];
                  const canSelect = formData.playerIds.includes(player.id) || formData.playerIds.length < config.requiredPlayers;
                  return (
                    <label
                      key={player.id}
                      className={`flex items-center space-x-2 ${canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.playerIds.includes(player.id)}
                        onChange={() => togglePlayer(player.id)}
                        className="rounded"
                        disabled={!canSelect}
                      />
                      <span>{player.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              disabled={formData.playerIds.length !== TOURNAMENT_CONFIGS[formData.type].requiredPlayers}
            >
              Create Tournament
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {tournaments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500">
            No tournaments yet. Create your first tournament!
          </div>
        ) : (
          tournaments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">{tournament.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(tournament.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tournament.playerIds.length} players • {tournament.type}-player tournament
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
              </Link>
            ))
        )}
      </div>
    </div>
  );
}
