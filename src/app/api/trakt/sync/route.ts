import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshTraktToken, syncWatchedTrakt } from "@/lib/trakt";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { traktRefreshToken: true, traktExpiresAt: true, traktAccessToken: true },
    });

    if (!user || !user.traktRefreshToken) {
      return NextResponse.json({ error: "Trakt account not linked" }, { status: 400 });
    }

    // Auto-refresh token if needed
    let accessToken = user.traktAccessToken;
    const now = Math.floor(Date.now() / 1000);

    if (!user.traktExpiresAt || user.traktExpiresAt <= now + 300) {
      try {
        const tokenData = await refreshTraktToken(session.user.id);
        accessToken = tokenData.access_token;
      } catch (err) {
        console.error("Failed to refresh Trakt token:", err);
        return NextResponse.json({ error: "Failed to refresh Trakt token. Please reconnect your account." }, { status: 401 });
      }
    }

    if (!accessToken) {
       return NextResponse.json({ error: "No valid access token available." }, { status: 401 });
    }

    const importedCount = await syncWatchedTrakt(session.user.id, accessToken);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${importedCount} items from Trakt!`,
    });

  } catch (error) {
    console.error("Trakt sync error:", error);
    return NextResponse.json({ error: "Failed to sync with Trakt" }, { status: 500 });
  }
}
