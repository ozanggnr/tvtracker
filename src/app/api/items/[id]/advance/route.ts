import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_URL = "https://api.themoviedb.org/3";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const item = await prisma.trackedItem.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    if (item.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle MOVIE: just mark completed
    if (item.itemType === "MOVIE") {
      const updated = await prisma.trackedItem.update({
        where: { id },
        data: { status: "COMPLETED", progress: 1, totalEpisodes: 1 }
      });
      return NextResponse.json({ success: true, item: updated, message: "Movie marked as Completed" });
    }

    // Handle BOOK: advance progress
    if (item.itemType === "BOOK") {
      const newProgress = (item.progress || 0) + 1;
      let newStatus = item.status === "PLAN_TO_READ" ? "READING" : item.status;
      
      if (item.totalPages && newProgress >= item.totalPages) {
        newStatus = "COMPLETED";
      }

      const updated = await prisma.trackedItem.update({
        where: { id },
        data: { progress: newProgress, status: newStatus }
      });
      return NextResponse.json({ success: true, item: updated, message: newStatus === "COMPLETED" ? "Book Completed!" : "Progress saved" });
    }

    // Handle TV_SERIES: advance season/episode intelligently via TMDB
    if (item.itemType === "TV_SERIES") {
      if (item.externalId?.startsWith("tmdb_tv_")) {
        const tmdbId = item.externalId.replace("tmdb_tv_", "");
        
        // Fetch TMDB series data to know season lengths
        const tmdbRes = await fetch(`${TMDB_URL}/tv/${tmdbId}`, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        });

        if (!tmdbRes.ok) {
          // Fallback to simple +1 episode if TMDB fails
          const newEp = (item.currentEpisode || 0) + 1;
          const updated = await prisma.trackedItem.update({
            where: { id },
            data: { 
              currentEpisode: newEp, 
              progress: (item.progress || 0) + 1,
              status: item.status === "PLAN_TO_WATCH" ? "WATCHING" : item.status
            }
          });
          return NextResponse.json({ success: true, item: updated, message: "Episode marked as watched" });
        }

        const showData = await tmdbRes.json();
        const seasons = showData.seasons || [];
        
        const curSeason = item.currentSeason || 1;
        const curEp = item.currentEpisode || 0;
        let newSeason = curSeason;
        let newEp = curEp + 1;
        let status = item.status;

        // Find the current season in TMDB data (ignore specials usually, season_number > 0)
        const seasonObj = seasons.find((s: any) => s.season_number === curSeason);
        
        if (seasonObj && newEp > seasonObj.episode_count) {
          // Wrap to next season
          const nextSeasonObj = seasons.find((s: any) => s.season_number === curSeason + 1);
          if (nextSeasonObj) {
            newSeason = curSeason + 1;
            newEp = 1;
          } else {
            // No more seasons! We finished the show!
            newEp = seasonObj.episode_count; // cap it
            status = "COMPLETED";
          }
        }

        const updated = await prisma.trackedItem.update({
          where: { id },
          data: { 
            currentSeason: newSeason, 
            currentEpisode: newEp,
            progress: (item.progress || 0) + 1,
            status: status === "PLAN_TO_WATCH" ? "WATCHING" : status
          }
        });

        return NextResponse.json({ success: true, item: updated, message: status === "COMPLETED" ? "Series Completed!" : `Watched S${newSeason} E${newEp}` });
      } else {
        // Non-TMDB TV Show fallback
        const newEp = (item.currentEpisode || 0) + 1;
        const updated = await prisma.trackedItem.update({
          where: { id },
          data: { 
            currentEpisode: newEp, 
            progress: (item.progress || 0) + 1,
            status: item.status === "PLAN_TO_WATCH" ? "WATCHING" : item.status
          }
        });
        return NextResponse.json({ success: true, item: updated, message: "Episode marked as watched" });
      }
    }

    // Fallback for any other types not handled
    const updated = await prisma.trackedItem.update({
      where: { id },
      data: { status: "COMPLETED" }
    });
    
    return NextResponse.json({ success: true, item: updated });

  } catch (error) {
    console.error("Advance progress error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
