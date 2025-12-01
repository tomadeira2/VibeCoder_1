import { NextRequest, NextResponse } from 'next/server';
import { getPlayers, addPlayer } from '@/lib/storage';
import { Player } from '@/types';

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        tournamentsPlayed: 0,
        totalPoints: 0,
      },
    };

    await addPlayer(newPlayer);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
