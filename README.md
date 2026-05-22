# Holocron Tracker — Media Tracking App

**Live App:** [https://tvtracker-production.up.railway.app/](https://tvtracker-production.up.railway.app/)

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

## Project Structure

The project is built using **Next.js 16 (App Router)** and uses **Prisma** for database interactions.

```text
src/
├── app/
│   ├── (app)/              # Authenticated pages (requires login)
│   │   ├── dashboard/      # Main dashboard with stats & recent items
│   │   ├── movies/         # Movie tracker listing
│   │   ├── series/         # TV series tracker listing
│   │   ├── books/          # Book tracker listing
│   │   ├── search/         # Unified search across external APIs
│   │   └── profile/        # User profile & Trakt connection settings
│   ├── api/                # Next.js API Route Handlers (Backend)
│   │   ├── auth/           # NextAuth login/signup & Trakt OAuth callbacks
│   │   ├── items/          # CRUD operations, tracking toggle, and episode advancement
│   │   ├── trakt/          # Trakt.tv manual sync endpoint
│   │   ├── search/         # TMDB + Google Books proxy search
│   │   ├── detail/         # External item detail fetching logic
│   │   ├── dashboard/      # Dashboard statistics aggregator
│   │   └── profile/        # User profile updates
│   ├── login/              # Login page
│   └── signup/             # Registration page
├── components/             # Reusable UI React Components
│   ├── sidebar.tsx         # Responsive navigation sidebar
│   ├── tracker-page.tsx    # Shared tracker list view used by Movies/Series/Books
│   ├── item-card.tsx       # Interactive media card with quick-action toggles
│   ├── detail-modal.tsx    # Full-screen modal for viewing and adding items
│   └── ...
├── lib/                    # Shared Libraries & Utilities
│   ├── auth.ts             # NextAuth v5 configuration and callbacks
│   ├── prisma.ts           # Prisma database client singleton
│   ├── trakt.ts            # Trakt.tv API exchange and sync helpers
│   └── utils.ts            # Formatting and styling utilities
└── types/                  # Global TypeScript type definitions
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Hosted on Railway) |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (JWT strategy) |
| Styling | Tailwind CSS v4 + custom CSS |
| APIs | TMDB, Google Books, Trakt.tv |
| Deployment | Railway (Docker / standalone) |

## License

Private project.
