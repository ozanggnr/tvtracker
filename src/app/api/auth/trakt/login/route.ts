import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.TRAKT_CLIENT_ID;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  
  if (!clientId) {
    return NextResponse.json({ error: "Missing TRAKT_CLIENT_ID" }, { status: 500 });
  }

  // Define where Trakt should send the user back to
  const redirectUri = `${appUrl}/api/auth/trakt/callback`;
  
  // Construct the Trakt OAuth URL
  const traktAuthUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  // Redirect the user to Trakt
  return NextResponse.redirect(traktAuthUrl);
}
