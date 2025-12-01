import { NextRequest, NextResponse } from 'next/server';
import { getPlayerById } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await getPlayerById(id);

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}
