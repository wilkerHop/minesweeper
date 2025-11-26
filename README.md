# ♾️ Infinite Minesweeper

A modern, serverless implementation of infinite Minesweeper with **deterministic game logic**, **replay functionality**, and **global leaderboards**.

## 🎮 Features

- **Infinite Grid**: Play on an endless minesweeper board
- **Deterministic Game Logic**: Seeded random number generation ensures consistent mine placement across all environments
- **Game Replays**: Every move is recorded and can be replayed
- **Global Leaderboard**: Compete with players worldwide
- **Multi-language Support**: Available in 8 languages
- **Modern Tech Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS

## 🏗️ Architecture

This project uses a **serverless architecture** with edge computing for optimal performance:

- **Frontend**: Next.js 15 App Router with React Server Components
- **Backend**: Next.js Server Actions for secure server-side operations
- **Databases**:
  - **Supabase**: Game sessions and leaderboard data (PostgreSQL)
  - **Turso**: Cell modification history for replays (SQLite at the edge)
- **Storage**: Cloudflare R2 for replay JSON files
- **Hosting**: Vercel (or any serverless platform)

### Why This Architecture?

1. **Deterministic Logic**: The seeded RNG ensures `hash(x, y, seed) = hash(x, y, seed)` always, preventing score exploits
2. **Edge Computing**: Turso provides low-latency writes for real-time gameplay
3. **Scalability**: Serverless functions scale automatically with player demand
4. **Cost-Effective**: Pay only for what you use with generous free tiers

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Accounts for: Supabase, Turso, Cloudflare R2

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/minesweeper.git
cd minesweeper

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your credentials in .env.local
# Then start the development server
npm run dev
```

Visit `http://localhost:3000` to see the game.

## 📊 Database Setup

### Supabase

1. Create a new project at https://app.supabase.com
2. Run the SQL from `supabase/schema.sql` in the SQL Editor
3. Copy your API credentials to `.env.local`

### Turso

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create minesweeper

# Get connection details
turso db show minesweeper

# Initialize schema
turso db shell minesweeper < turso/schema.sql
```

### Cloudflare R2

1. Create an R2 bucket at https://dash.cloudflare.com
2. Generate API credentials
3. Add to `.env.local`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:performance  # Performance benchmarks

# Security audit
npm run security:audit
```

## 📦 Deployment

### Quick Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/minesweeper)

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions covering:
- Environment configuration
- GitHub Actions CI/CD setup
- Production deployment steps
- Monitoring and troubleshooting

## 🗂️ Project Structure

```
minesweeper/
├── app/
│   ├── actions/          # Server Actions
│   │   ├── game.ts       # Game session management
│   │   ├── leaderboard.ts # Leaderboard operations
│   │   └── replay.ts     # Replay functionality
│   ├── api/              # API routes
│   └── page.tsx          # Main game page
├── components/           # React components
├── lib/
│   ├── db/              # Database clients
│   │   ├── supabase.ts
│   │   └── turso.ts
│   ├── game/            # Game logic
│   │   ├── deterministic.ts  # Seeded RNG
│   │   ├── constants.ts
│   │   └── types.ts
│   └── env.ts           # Environment validation
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── e2e/             # End-to-end tests
│   └── performance/     # Performance tests
├── supabase/
│   └── schema.sql       # Supabase database schema
├── turso/
│   └── schema.sql       # Turso database schema
├── legacy/              # Original vanilla JS implementation
└── .github/
    └── workflows/
        └── deploy.yml   # CI/CD pipeline
```

## 🎯 Game Logic

The core game engine uses a **deterministic hashing function**:

```typescript
hash(x, y, seed) → boolean // Is there a mine at (x, y)?
```

This ensures:
- **Consistency**: Same coordinates always produce the same result
- **Security**: Seeds are generated server-side and never exposed to clients
- **Replay Capability**: Games can be perfectly reconstructed from move history

## 📈 Monetization

The project supports various monetization strategies while remaining **open-source** and free-to-play:

- **Ads**: Non-intrusive banner placements
- **Premium Features**:
  - Ad-free experience
  - Advanced statistics
  - Custom themes
  - Replay analysis tools

## 🌐 Internationalization

Supported languages:
- English (en)
- Portuguese (pt)
- Spanish (es)
- Chinese (zh)
- Russian (ru)
- Arabic (ar)
- Hindi (hi)
- Afrikaans (af)

## 📝 API Documentation

### Server Actions

#### `createGameSession()`
Creates a new game session with a unique seed.

#### `recordCellModification(sessionId, x, y, action)`
Records a cell action (REVEAL, FLAG, UNFLAG) for replay.

#### `endGameSession(sessionId, score, status)`
Ends a game and records the final score.

#### `submitToLeaderboard(sessionId, playerName, cellsRevealed, timePlayed)`
Submits a completed game to the global leaderboard.

#### `getTopScores(limit)`
Retrieves the top N scores from the leaderboard.

See inline code documentation for complete API details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Minesweeper game concept by Microsoft
- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/) and [Turso](https://turso.tech/)
- Storage by [Cloudflare R2](https://www.cloudflare.com/products/r2/)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Review the troubleshooting section

---

Made with ❤️ using AI-assisted development
