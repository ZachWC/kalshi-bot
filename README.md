# Kalshi Auto-Sell Trading Bot

A multi-user SaaS platform that automates position management on Kalshi prediction markets. Users connect their Kalshi accounts via API keys, add positions through a web interface, and the platform automatically sells positions when they reach user-defined target percentages.

## Features

- 🔐 Secure API key storage with AES-256-GCM encryption
- 📊 Real-time position tracking and monitoring
- 🤖 Automated trade execution when targets are reached
- 📈 Trade history and analytics
- 👥 Multi-user support with isolated accounts
- 🎨 Modern web-based dashboard (no CLI needed)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **Worker**: Node.js background process
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL with Row Level Security)

## Setup

### Prerequisites

- Node.js 20+
- Supabase account
- Kalshi API keys

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd kalshi-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Generate an encryption key:
```bash
node scripts/generate-encryption-key.js
```

Add the generated key to `.env.local` along with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ENCRYPTION_KEY=your_64_character_hex_key
```

4. Set up the database:
   - Go to your Supabase project
   - Run the SQL from `supabase/migrations/001_initial_schema.sql` in the SQL editor

5. Run the development server:
```bash
npm run dev
```

## Worker Setup

The background worker monitors positions and executes sell orders. To run it:

1. Install worker dependencies:
```bash
cd worker
npm install
```

2. Set environment variables (same as frontend, plus):
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ENCRYPTION_KEY=your_64_character_hex_key
WORKER_INTERVAL_MS=60000
```

3. Run the worker:
```bash
node index.js
```

### Railway Deployment

The worker can be deployed to Railway using the included Dockerfile:

1. Create a new Railway project
2. Connect your GitHub repository
3. Set the root directory to `/worker`
4. Add environment variables
5. Deploy

## Usage

1. **Sign up** for an account
2. **Connect your Kalshi API keys** during onboarding
3. **Add positions** through the dashboard
4. The worker will **automatically monitor** and sell when targets are reached

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── encryption.ts     # Encryption utilities
│   ├── kalshi/           # Kalshi API wrapper
│   └── supabase/         # Supabase clients
├── worker/               # Background worker
│   ├── index.js          # Worker entry point
│   ├── monitoring-loop.js
│   └── ...
└── supabase/             # Database migrations
```

## Security

- All Kalshi API keys are encrypted using AES-256-GCM before storage
- Row Level Security (RLS) ensures users can only access their own data
- API keys are never logged or exposed in client-side code
- All API routes require authentication

## License

MIT



