import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic = pathname === "/";
  const isPublicApi = pathname === "/api/register";

  // Check for session token (NextAuth JWT)
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Allow public routes and auth API
  if (isPublicApi || isApiAuth) return NextResponse.next();

  // Redirect authenticated users away from auth pages
  if (isAuthPage) {
    if (token) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  // Redirect authenticated users away from landing page
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public root
  if (isPublic) return NextResponse.next();

  // Require auth for all other routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
