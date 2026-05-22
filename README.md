# Holocron Tracker — Media Tracking App

**Live:** [https://tvtracker-production.up.railway.app/](https://tvtracker-production.up.railway.app/)

A full-stack media tracking application inspired by [Trakt.tv](https://trakt.tv). Track your movies, TV series, and books in one place with a clean, modern interface.

## Features

- **Track Movies, TV Shows & Books** — Add items from TMDB and Google Books databases, set statuses (Plan to Watch, Watching, Completed, Dropped, Favorite), rate them, and add personal notes.
- **Trakt.tv Integration** — Connect your Trakt.tv account via OAuth to import your watched history. Supports manual re-sync and automatic periodic syncing.
- **One-Click Tracking** — Mark movies as watched, advance TV episodes, and update book progress with a single click directly from media cards.
- **Smart Episode Tracking** — Automatically advances through TV seasons and episodes using TMDB season data. Marks shows as completed when you finish the last episode.
- **Search & Discover** — Search TMDB for movies and TV shows, and Google Books / Open Library for books. View detailed information including cast, ratings, genres, trailers, and more.
- **Dashboard** — Overview of your media collection with statistics, recent activity, and in-progress items.
- **Responsive Design** — Works on desktop, tablet, and mobile with a collapsible sidebar navigation.
- **User Authentication** — Secure sign-up and login with email/password credentials using NextAuth.js v5.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Railway) |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (JWT strategy) |
| Styling | Tailwind CSS v4 + custom CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| APIs | TMDB, Google Books, Open Library, Trakt.tv |
| Deployment | Railway (Docker / standalone) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for TMDB, and optionally Google Books and Trakt.tv

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ozanggnr/tvtracker.git
   cd tvtracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

See [`.env.example`](.env.example) for all required and optional variables.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | App URL (e.g., `http://localhost:3000`) |
| `TMDB_API_KEY` | ✅ | TMDB Read Access Token (Bearer JWT) |
| `TMDB_V3_KEY` | ✅ | TMDB v3 API key |
| `GOOGLE_BOOKS_API_KEY` | ❌ | Google Books API key |
| `TRAKT_CLIENT_ID` | ❌ | Trakt.tv OAuth client ID |
| `TRAKT_CLIENT_SECRET` | ❌ | Trakt.tv OAuth client secret |
| `APP_URL` | ❌ | Production URL for OAuth callbacks |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated pages
│   │   ├── dashboard/      # Dashboard with stats & recent items
│   │   ├── movies/         # Movie tracker
│   │   ├── series/         # TV series tracker
│   │   ├── books/          # Book tracker
│   │   ├── search/         # Multi-source search
│   │   └── profile/        # User profile & Trakt settings
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth + Trakt OAuth
│   │   ├── items/          # CRUD + toggle + advance
│   │   ├── trakt/          # Trakt sync endpoint
│   │   ├── search/         # TMDB + Google Books search
│   │   ├── detail/         # External item detail fetching
│   │   ├── dashboard/      # Dashboard statistics
│   │   └── profile/        # User profile
│   ├── login/              # Login page
│   └── signup/             # Registration page
├── components/             # React components
│   ├── sidebar.tsx         # Navigation sidebar (responsive)
│   ├── tracker-page.tsx    # Shared tracker list view
│   ├── item-card.tsx       # Media card with quick actions
│   ├── detail-modal.tsx    # Item detail & add modal
│   └── ...
├── lib/                    # Shared utilities
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   ├── trakt.ts            # Trakt.tv API helpers
│   └── ...
└── types/                  # TypeScript type definitions
```

## Trakt.tv Integration

To enable Trakt.tv sync:

1. Create an app at [trakt.tv/oauth/applications](https://trakt.tv/oauth/applications)
2. Set the redirect URI to `{YOUR_APP_URL}/api/auth/trakt/callback`
3. Add `TRAKT_CLIENT_ID` and `TRAKT_CLIENT_SECRET` to your `.env`
4. Users can connect via Profile → "Connect Trakt.tv"

## License

Private project.
