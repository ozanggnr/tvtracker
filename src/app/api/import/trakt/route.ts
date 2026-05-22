import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTMDBImages } from "@/lib/trakt";

const TRAKT_API_URL = "https://api.trakt.tv";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Trakt username is required" }, { status: 400 });
    }

    const clientId = process.env.TRAKT_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Trakt integration is not configured on the server" }, { status: 503 });
    }

    const headers = {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": clientId,
    };

    // Fetch movies and shows in parallel
    const [moviesRes, showsRes, watchlistMoviesRes, watchlistShowsRes] = await Promise.all([
      fetch(`${TRAKT_API_URL}/users/${username}/watched/movies`, { headers }),
      fetch(`${TRAKT_API_URL}/users/${username}/watched/shows`, { headers }),
      fetch(`${TRAKT_API_URL}/users/${username}/watchlist/movies`, { headers }),
      fetch(`${TRAKT_API_URL}/users/${username}/watchlist/shows`, { headers })
    ]);

    if (moviesRes.status === 404 || showsRes.status === 404) {
      return NextResponse.json({ error: "User not found or profile is private" }, { status: 404 });
    }

    if (!moviesRes.ok || !showsRes.ok || !watchlistMoviesRes.ok || !watchlistShowsRes.ok) {
      const mStatus = moviesRes.status;
      const sStatus = showsRes.status;
      console.error(`Trakt API failed: Movies [${mStatus}], Shows [${sStatus}]`);
      
      if (mStatus === 401 || mStatus === 403 || sStatus === 401 || sStatus === 403) {
         return NextResponse.json({ error: "Trakt profile is private or API Key is invalid." }, { status: 403 });
      }
      
      return NextResponse.json({ error: `Trakt API returned an error (Movies: ${mStatus}, Shows: ${sStatus})` }, { status: 502 });
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
          const { posterUrl, backdropUrl } = await fetchTMDBImages(item.id, item.type);

          await prisma.trackedItem.upsert({
            where: {
              userId_externalId_itemType: {
                userId: session.user.id,
                externalId,
                itemType: item.type,
              },
            },
            update: {
              status: item.status,
              ...(posterUrl && { posterUrl }),
              ...(backdropUrl && { backdropUrl }),
            },
            create: {
              userId: session.user.id,
              externalId,
              itemType: item.type,
              title: item.title,
              releaseYear: item.year,
              status: item.status,
              posterUrl,
              backdropUrl,
            },
          });
          importedCount++;
        })
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${importedCount} items from Trakt! Posters are being enriched.` 
    });

  } catch (error) {
    console.error("Trakt import error:", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
