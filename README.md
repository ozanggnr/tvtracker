# Holocron Tracker

A full-stack personal media tracker with a Star Wars-inspired dark space theme.

## Tech Stack
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **PostgreSQL** (hosted on Railway)
- **Prisma ORM**
- **NextAuth v5** (credentials provider, JWT sessions)

## Features
- 🎬 Track Movies (via TMDB)
- 📺 Track TV Series (via TMDB)
- 📚 Track Books (via Google Books + Open Library fallback)
- ⭐ Rate, review, and track progress
- 🔍 Real-time debounced search with rich detail modals
- 🔒 Private per-user archive

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`

Optional (for full API features):
- `TMDB_API_KEY` — TMDB Read Access Token (Bearer JWT)
- `TMDB_V3_KEY` — TMDB v3 API key
- `GOOGLE_BOOKS_API_KEY` — Google Books API key

### 3. Initialize the database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Railway Deployment

### Environment Variables to set in Railway:
```
DATABASE_URL=<your-railway-postgres-url>
NEXTAUTH_SECRET=<generate-a-strong-secret>
NEXTAUTH_URL=<your-railway-app-url>
TMDB_API_KEY=<your-tmdb-read-access-token>
TMDB_V3_KEY=<your-tmdb-v3-api-key>
GOOGLE_BOOKS_API_KEY=<optional>
```

### Deploy commands (Railway will auto-detect):
- Build: `npm run build`
- Start: `npm start`
- Or set custom start: `npx prisma migrate deploy && npm start`

## Project Structure
```
src/
├── app/
│   ├── (app)/          # Authenticated pages (behind middleware)
│   │   ├── dashboard/
│   │   ├── movies/
│   │   ├── series/
│   │   ├── books/
│   │   ├── search/
│   │   └── profile/
│   ├── api/
│   │   ├── auth/
│   │   ├── items/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── search/     # TMDB + Google Books
│   │   └── detail/     # Full metadata fetch
│   ├── login/
│   ├── signup/
│   └── page.tsx        # Landing page
├── components/
│   ├── sidebar.tsx
│   ├── item-card.tsx
│   ├── detail-modal.tsx
│   ├── edit-item-modal.tsx
│   ├── search-result-card.tsx
│   ├── star-rating.tsx
│   ├── tracker-page.tsx
│   └── starfield.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── utils.ts
│   └── validations.ts
├── middleware.ts
└── types/
    └── index.ts
prisma/
└── schema.prisma
```
