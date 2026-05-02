import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      totalMovies,
      totalSeries,
      totalBooks,
      completed,
      watching,
      planToWatch,
      favorites,
      ratingResult,
    ] = await Promise.all([
      prisma.trackedItem.count({ where: { userId, itemType: "MOVIE" } }),
      prisma.trackedItem.count({ where: { userId, itemType: "TV_SERIES" } }),
      prisma.trackedItem.count({ where: { userId, itemType: "BOOK" } }),
      prisma.trackedItem.count({ where: { userId, status: "COMPLETED" } }),
      prisma.trackedItem.count({ where: { userId, status: "WATCHING" } }),
      prisma.trackedItem.count({ where: { userId, status: "PLAN_TO_WATCH" } }),
      prisma.trackedItem.count({ where: { userId, status: "FAVORITE" } }),
      prisma.trackedItem.aggregate({
        where: { userId, rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    const recentItems = await prisma.trackedItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 12,
    });

    const continueWatching = await prisma.trackedItem.findMany({
      where: { userId, itemType: "TV_SERIES", status: "WATCHING" },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const startWatching = await prisma.trackedItem.findMany({
      where: { userId, itemType: "TV_SERIES", status: "PLAN_TO_WATCH" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        totalMovies,
        totalSeries,
        totalBooks,
        completed,
        watching,
        planToWatch,
        favorites,
        avgRating: ratingResult._avg.rating,
      },
      recentItems,
      continueWatching,
      startWatching,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
