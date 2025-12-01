import { promises as fs } from 'fs';
import path from 'path';
import { Player, Tournament, Match } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Players
export async function getPlayers(): Promise<Player[]> {
  return readJSON<Player[]>('players.json', []);
}

export async function savePlayers(players: Player[]): Promise<void> {
  await writeJSON('players.json', players);
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const players = await getPlayers();
  return players.find(p => p.id === id) || null;
}

export async function addPlayer(player: Player): Promise<void> {
  const players = await getPlayers();
  players.push(player);
  await savePlayers(players);
}

export async function updatePlayer(player: Player): Promise<void> {
  const players = await getPlayers();
  const index = players.findIndex(p => p.id === player.id);
  if (index !== -1) {
    players[index] = player;
    await savePlayers(players);
  }
}

// Tournaments
export async function getTournaments(): Promise<Tournament[]> {
  return readJSON<Tournament[]>('tournaments.json', []);
}

export async function saveTournaments(tournaments: Tournament[]): Promise<void> {
  await writeJSON('tournaments.json', tournaments);
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const tournaments = await getTournaments();
  return tournaments.find(t => t.id === id) || null;
}

export async function addTournament(tournament: Tournament): Promise<void> {
  const tournaments = await getTournaments();
  tournaments.push(tournament);
  await saveTournaments(tournaments);
}

export async function updateTournament(tournament: Tournament): Promise<void> {
  const tournaments = await getTournaments();
  const index = tournaments.findIndex(t => t.id === tournament.id);
  if (index !== -1) {
    tournaments[index] = tournament;
    await saveTournaments(tournaments);
  }
}

// Matches
export async function getMatches(): Promise<Match[]> {
  return readJSON<Match[]>('matches.json', []);
}

export async function saveMatches(matches: Match[]): Promise<void> {
  await writeJSON('matches.json', matches);
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  const matches = await getMatches();
  return matches.filter(m => m.tournamentId === tournamentId);
}

export async function updateMatch(match: Match): Promise<void> {
  const matches = await getMatches();
  const index = matches.findIndex(m => m.id === match.id);
  if (index !== -1) {
    matches[index] = match;
    await saveMatches(matches);
  }
}
