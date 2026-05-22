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

  const [moviesRes, showsRes] = await Promise.all([
    fetch(`${TRAKT_API_URL}/sync/watched/movies`, { headers }),
    fetch(`${TRAKT_API_URL}/sync/watched/shows`, { headers }),
  ]);

  if (!moviesRes.ok || !showsRes.ok) {
    throw new Error("Failed to fetch synced data from Trakt");
  }

  const movies = await moviesRes.json();
  const shows = await showsRes.json();
  let importedCount = 0;

  for (const item of movies) {
    if (!item.movie?.ids?.tmdb) continue;
    
    const tmdbId = item.movie.ids.tmdb;
    const externalId = `tmdb_movie_${tmdbId}`;
    const title = item.movie.title;
    const releaseYear = item.movie.year;
    
    const posterUrl = await fetchTMDBPoster(tmdbId, "MOVIE");

    await prisma.trackedItem.upsert({
      where: {
        userId_externalId_itemType: {
          userId,
          externalId,
          itemType: "MOVIE",
        },
      },
      update: {
        status: "COMPLETED",
        ...(posterUrl && { posterUrl }),
      },
      create: {
        userId,
        externalId,
        itemType: "MOVIE",
        title,
        releaseYear,
        status: "COMPLETED",
        posterUrl,
      },
    });
    importedCount++;
  }

  for (const item of shows) {
    if (!item.show?.ids?.tmdb) continue;
    
    const tmdbId = item.show.ids.tmdb;
    const externalId = `tmdb_tv_${tmdbId}`;
    const title = item.show.title;
    const releaseYear = item.show.year;
    
    const posterUrl = await fetchTMDBPoster(tmdbId, "TV_SERIES");

    await prisma.trackedItem.upsert({
      where: {
        userId_externalId_itemType: {
          userId,
          externalId,
          itemType: "TV_SERIES",
        },
      },
      update: {
        status: "COMPLETED",
        ...(posterUrl && { posterUrl }),
      },
      create: {
        userId,
        externalId,
        itemType: "TV_SERIES",
        title,
        releaseYear,
        status: "COMPLETED",
        posterUrl,
      },
    });
    importedCount++;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastTraktSync: new Date() },
  });

  return importedCount;
}
