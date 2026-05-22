import { prisma } from "@/lib/prisma";

const TRAKT_API_URL = "https://api.trakt.tv";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export async function exchangeTraktCode(code: string, redirectUri: string) {
  const clientId = process.env.TRAKT_CLIENT_ID;
  const clientSecret = process.env.TRAKT_CLIENT_SECRET;

  const res = await fetch(`${TRAKT_API_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to exchange code for token");
  }

  return res.json();
}

export async function refreshTraktToken(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.traktRefreshToken) {
    throw new Error("User or refresh token not found");
  }

  // Check if token needs refresh
  const now = Math.floor(Date.now() / 1000);
  if (user.traktExpiresAt && user.traktExpiresAt > now + 300) {
    return {
      access_token: user.traktAccessToken,
      refresh_token: user.traktRefreshToken,
    };
  }

  const clientId = process.env.TRAKT_CLIENT_ID;
  const clientSecret = process.env.TRAKT_CLIENT_SECRET;

  const res = await fetch(`${TRAKT_API_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: user.traktRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await res.json();

  await prisma.user.update({
    where: { id: userId },
    data: {
      traktAccessToken: data.access_token,
      traktRefreshToken: data.refresh_token,
      traktExpiresAt: data.created_at + data.expires_in,
    },
  });

  return data;
}

export async function fetchTMDBPoster(tmdbId: number, type: "MOVIE" | "TV_SERIES") {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const endpoint = type === "MOVIE" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  
  try {
    const res = await fetch(`${TMDB_API_URL}${endpoint}`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null;
  } catch (err) {
    console.error("Error fetching TMDB poster:", err);
    return null;
  }
}

export async function syncWatchedTrakt(userId: string, accessToken: string) {
  const clientId = process.env.TRAKT_CLIENT_ID;
  const headers = {
    "Content-Type": "application/json",
    "trakt-api-version": "2",
    "trakt-api-key": clientId!,
    Authorization: `Bearer ${accessToken}`,
  };

  const [moviesRes, showsRes, watchlistMoviesRes, watchlistShowsRes] = await Promise.all([
    fetch(`${TRAKT_API_URL}/sync/watched/movies`, { headers }),
    fetch(`${TRAKT_API_URL}/sync/watched/shows`, { headers }),
    fetch(`${TRAKT_API_URL}/sync/watchlist/movies`, { headers }),
    fetch(`${TRAKT_API_URL}/sync/watchlist/shows`, { headers }),
  ]);

  if (!moviesRes.ok || !showsRes.ok || !watchlistMoviesRes.ok || !watchlistShowsRes.ok) {
    throw new Error("Failed to fetch synced data from Trakt");
  }

  const movies = await moviesRes.json();
  const shows = await showsRes.json();
  const watchlistMovies = await watchlistMoviesRes.json();
  const watchlistShows = await watchlistShowsRes.json();
  
  let importedCount = 0;

  // Helper to chunk arrays
  const chunkArray = <T>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // Combine and format items
  type ProcessItem = { type: "MOVIE" | "TV_SERIES"; id: number; title: string; year: number; status: any };
  
  const allItems: ProcessItem[] = [
    ...movies.filter((i: any) => i.movie?.ids?.tmdb).map((i: any) => ({
      type: "MOVIE" as const, id: i.movie.ids.tmdb, title: i.movie.title, year: i.movie.year, status: "COMPLETED"
    })),
    ...shows.filter((i: any) => i.show?.ids?.tmdb).map((i: any) => ({
      type: "TV_SERIES" as const, id: i.show.ids.tmdb, title: i.show.title, year: i.show.year, status: "WATCHING"
    })),
    ...watchlistMovies.filter((i: any) => i.movie?.ids?.tmdb).map((i: any) => ({
      type: "MOVIE" as const, id: i.movie.ids.tmdb, title: i.movie.title, year: i.movie.year, status: "PLAN_TO_WATCH"
    })),
    ...watchlistShows.filter((i: any) => i.show?.ids?.tmdb).map((i: any) => ({
      type: "TV_SERIES" as const, id: i.show.ids.tmdb, title: i.show.title, year: i.show.year, status: "PLAN_TO_WATCH"
    })),
  ];

  const chunks = chunkArray(allItems, 15);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (item) => {
        const externalId = item.type === "MOVIE" ? `tmdb_movie_${item.id}` : `tmdb_tv_${item.id}`;
        const posterUrl = await fetchTMDBPoster(item.id, item.type);

        await prisma.trackedItem.upsert({
          where: {
            userId_externalId_itemType: {
              userId,
              externalId,
              itemType: item.type,
            },
          },
          update: {
            status: item.status,
            ...(posterUrl && { posterUrl }),
          },
          create: {
            userId,
            externalId,
            itemType: item.type,
            title: item.title,
            releaseYear: item.year,
            status: item.status,
            posterUrl,
          },
        });
        importedCount++;
      })
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastTraktSync: new Date() },
  });

  return importedCount;
}
