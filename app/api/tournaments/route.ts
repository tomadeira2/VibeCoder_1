import { NextRequest, NextResponse } from 'next/server';
import { getTournaments, addTournament } from '@/lib/storage';
import { Tournament } from '@/types';
import { generateTeams, generateRoundRobinMatches, DEFAULT_POINTS_DISTRIBUTION } from '@/lib/tournament';

export async function GET() {
  try {
    const tournaments = await getTournaments();
    return NextResponse.json(tournaments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tournamentId = `tournament-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate teams from players
    const teams = generateTeams(body.playerIds);

    // Generate round robin matches
    const roundRobinMatches = generateRoundRobinMatches(tournamentId, teams);

    const newTournament: Tournament = {
      id: tournamentId,
      name: body.name,
      date: body.date,
      status: 'upcoming',
      playerIds: body.playerIds,
      roundRobinMatches,
      knockoutMatches: [],
      pointsDistribution: body.pointsDistribution || DEFAULT_POINTS_DISTRIBUTION,
      createdAt: new Date().toISOString(),
    };

    await addTournament(newTournament);
    return NextResponse.json(newTournament, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
