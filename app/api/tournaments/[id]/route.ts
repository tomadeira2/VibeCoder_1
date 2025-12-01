import { NextRequest, NextResponse } from 'next/server';
import { getTournamentById, updateTournament } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await getTournamentById(id);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tournament = await getTournamentById(id);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const updatedTournament = { ...tournament, ...body };
    await updateTournament(updatedTournament);

    return NextResponse.json(updatedTournament);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}
