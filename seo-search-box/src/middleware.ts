import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight auth guard — checks for the session cookie only.
 * Actual session validation happens server-side in page/route handlers.
 * We avoid importing `auth` here because the DrizzleAdapter uses the
 * postgres driver which requires Node.js `net` (unavailable in Edge Runtime).
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for NextAuth session cookie (Secure prefix used in production)
  const hasSession =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("authjs.session-token");

  if (!hasSession) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/history/:path*", "/saved-searches/:path*", "/captures/:path*"],
};
