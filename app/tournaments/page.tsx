'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tournament, Player } from '@/types';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
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

    if (formData.playerIds.length < 4) {
      alert('Please select at least 4 players for the tournament');
      return;
    }

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', date: '', playerIds: [] });
        setShowForm(false);
        fetchData();
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
          disabled={players.length < 4}
        >
          {showForm ? 'Cancel' : 'Create New Tournament'}
        </button>
      </div>

      {players.length < 4 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
          You need at least 4 registered players to create a tournament.
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
              <label className="block mb-2 font-medium">
                Select Players ({formData.playerIds.length} selected, minimum 4)
              </label>
              <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 border rounded dark:border-gray-600">
                {players.map((player) => (
                  <label key={player.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.playerIds.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      className="rounded"
                    />
                    <span>{player.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              disabled={formData.playerIds.length < 4}
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
                      {tournament.playerIds.length} players
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
