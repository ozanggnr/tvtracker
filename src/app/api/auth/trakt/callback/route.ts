import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}/login`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    
    if (!code) {
      return NextResponse.redirect(`${appUrl}/profile?traktError=No+authorization+code+received`);
    }

    const clientId = process.env.TRAKT_CLIENT_ID;
    const clientSecret = process.env.TRAKT_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/trakt/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "HolocronTracker/1.0"
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed", await tokenRes.text());
      return NextResponse.redirect(`${appUrl}/profile?traktError=Failed+to+authenticate+with+Trakt`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch watched history using the access token
    const headers = {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": clientId!,
      "Authorization": `Bearer ${accessToken}`,
      "User-Agent": "HolocronTracker/1.0"
    };

    const [moviesRes, showsRes] = await Promise.all([
      fetch(`https://api.trakt.tv/sync/watched/movies`, { headers }),
      fetch(`https://api.trakt.tv/sync/watched/shows`, { headers })
    ]);

    if (!moviesRes.ok || !showsRes.ok) {
      console.error("Failed to fetch synced data");
      return NextResponse.redirect(`${appUrl}/profile?traktError=Failed+to+sync+watched+history`);
    }

    const movies = await moviesRes.json();
    const shows = await showsRes.json();

    let importedCount = 0;

    // 3. Process movies
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
        update: {},
        create: {
          userId: session.user.id,
          externalId,
          itemType: "MOVIE",
          title,
          releaseYear,
          status: "COMPLETED",
        }
      });
      importedCount++;
    }

    // 4. Process shows
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
        update: {},
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

    // Redirect back to profile with success
    return NextResponse.redirect(`${appUrl}/profile?traktSuccess=${importedCount}`);

  } catch (error) {
    console.error("Trakt OAuth error:", error);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/profile?traktError=An+unexpected+error+occurred`);
  }
}
