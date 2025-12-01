import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/storage';
import { Ranking } from '@/types';

export async function GET() {
  try {
    const players = await getPlayers();

    const rankings: Ranking[] = players
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        totalPoints: player.stats.totalPoints,
        tournamentsPlayed: player.stats.tournamentsPlayed,
        wins: player.stats.matchesWon,
        losses: player.stats.matchesLost,
        rank: 0,
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        return a.losses - b.losses;
      })
      .map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
      }));

    return NextResponse.json(rankings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
