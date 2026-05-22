import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeTraktCode, syncWatchedTrakt } from "@/lib/trakt";

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

    const redirectUri = `${appUrl}/api/auth/trakt/callback`;

    // 1. Exchange code for access token
    const tokenData = await exchangeTraktCode(code, redirectUri);
    const accessToken = tokenData.access_token;
    
    // Fetch username (optional, for complete data)
    let traktUsername = null;
    try {
      const settingsRes = await fetch("https://api.trakt.tv/users/settings", {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": process.env.TRAKT_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
        }
      });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        traktUsername = settings.user.username;
      }
    } catch (e) {
      console.error("Failed to fetch trakt username", e);
    }

    // Update user with Trakt tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        traktAccessToken: tokenData.access_token,
        traktRefreshToken: tokenData.refresh_token,
        traktExpiresAt: tokenData.created_at + tokenData.expires_in,
        ...(traktUsername && { traktUsername })
      }
    });

    // 2. Fetch watched history using the access token and sync
    const importedCount = await syncWatchedTrakt(session.user.id, accessToken);

    // Redirect back to profile with success
    return NextResponse.redirect(`${appUrl}/profile?traktSuccess=${importedCount}`);

  } catch (error) {
    console.error("Trakt OAuth error:", error);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/profile?traktError=An+unexpected+error+occurred`);
  }
}
