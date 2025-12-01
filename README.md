# Padel Tournament Manager

A comprehensive web application for managing padel tournaments, player rankings, and statistics.

## Features

### Tournament Management
- **Round Robin Stage**: Automatically generates all possible team pairings from registered players
- **Knockout Stage**: Top 4 teams from round robin advance to semi-finals and finals
- **Match Tracking**: Record scores for each match with detailed set-by-set results
- **Automatic Progression**: Tournament automatically advances from round robin to knockout to completion

### Player Management
- **Registration**: Simple player registration with name and email
- **Profiles**: Detailed player profiles with statistics including:
  - Total points across all tournaments
  - Matches won/lost with win rate
  - Tournament participation history
  - Performance graphs

### Global Rankings
- **Points System**:
  - Tournament Winner: 100 points
  - Runner-up: 60 points
  - Semi-final: 30 points
  - Round Robin Win: 5 points per win
  - Participation: 10 points
- **Leaderboard**: Ranked by total points, with tiebreakers for wins and losses
- **Statistics**: Win/loss records and win rate percentages

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: JSON file-based storage (easy to migrate to database)
- **API**: Next.js API Routes

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
npm run build
npm start
```

## Usage

### Creating a Tournament

1. Register at least 4 players in the Players section
2. Go to Tournaments and click "Create New Tournament"
3. Enter tournament name, date, and select players (minimum 4)
4. The app automatically generates:
   - All team combinations from selected players
   - Round robin matches (every team plays every other team)

### Running a Tournament

1. Open the tournament detail page
2. Enter scores for each round robin match
3. Once all round robin matches are complete, the app automatically:
   - Calculates standings based on wins, sets, and games
   - Generates semi-final matches (1st vs 4th, 2nd vs 3rd)
4. Enter semi-final scores
5. The final match is automatically generated
6. Complete the final to finish the tournament
7. Player stats and rankings are automatically updated

### Viewing Rankings

- Navigate to Rankings to see the global leaderboard
- Rankings are calculated based on points earned across all completed tournaments
- Click on any player name to view their detailed profile

## Data Storage

Tournament and player data is stored in JSON files in the `/data` directory:
- `players.json`: Player information and statistics
- `tournaments.json`: Tournament details and matches
- `matches.json`: Individual match records

This can be easily migrated to a database like PostgreSQL or MongoDB in the future.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── players/          # Player pages
│   ├── tournaments/      # Tournament pages
│   ├── rankings/         # Rankings page
│   └── layout.tsx        # Root layout with navigation
├── lib/
│   ├── storage.ts        # Data persistence layer
│   └── tournament.ts     # Tournament logic and algorithms
├── types/
│   └── index.ts          # TypeScript type definitions
└── components/           # Reusable React components
```

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Tournament brackets visualization
- Player vs player head-to-head statistics
- Export tournament results to PDF
- Mobile app version
- Real-time updates with WebSockets
- Tournament templates and custom scoring rules
