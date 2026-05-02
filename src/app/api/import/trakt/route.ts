import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const [moviesRes, showsRes] = await Promise.all([
      fetch(`${TRAKT_API_URL}/users/${username}/watched/movies`, { headers }),
      fetch(`${TRAKT_API_URL}/users/${username}/watched/shows`, { headers })
    ]);

    if (moviesRes.status === 404 || showsRes.status === 404) {
      return NextResponse.json({ error: "User not found or profile is private" }, { status: 404 });
    }

    if (!moviesRes.ok || !showsRes.ok) {
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

    let importedCount = 0;

    // Process movies
    for (const item of movies) {
      if (!item.movie?.ids?.tmdb) continue;
      
      const externalId = `tmdb_movie_${item.movie.ids.tmdb}`;
      const title = item.movie.title;
      const releaseYear = item.movie.year;

      await prisma.trackedItem.upsert({
        where: {
          userId_externalId_itemType: {
            userId: session.user.id,
            externalId: externalId,
            itemType: "MOVIE"
          }
        },
        update: {}, // Don't overwrite existing items
        create: {
          userId: session.user.id,
          externalId,
          itemType: "MOVIE",
          title,
          releaseYear,
          status: "COMPLETED",
          // We don't have posters from the watched endpoint natively, but the search API/detail page fixes this later
        }
      });
      importedCount++;
    }

    // Process shows
    for (const item of shows) {
      if (!item.show?.ids?.tmdb) continue;
      
      const externalId = `tmdb_tv_${item.show.ids.tmdb}`;
      const title = item.show.title;
      const releaseYear = item.show.year;

      await prisma.trackedItem.upsert({
        where: {
          userId_externalId_itemType: {
            userId: session.user.id,
            externalId: externalId,
            itemType: "TV_SERIES"
          }
        },
        update: {}, // Don't overwrite existing
        create: {
          userId: session.user.id,
          externalId,
          itemType: "TV_SERIES",
          title,
          releaseYear,
          status: "COMPLETED",
        }
      });
      importedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${importedCount} watched items from Trakt! Note: Posters will load when you view item details.` 
    });

  } catch (error) {
    console.error("Trakt import error:", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
