import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isPublic = nextUrl.pathname === "/";

  // Allow public routes and auth API
  if (isPublic || isApiAuth) return NextResponse.next();

  // Redirect authenticated users away from auth pages
  if (isAuthPage) {
    if (session) return NextResponse.redirect(new URL("/dashboard", nextUrl));
    return NextResponse.next();
  }

  // Require auth for all other routes
  if (!session) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
