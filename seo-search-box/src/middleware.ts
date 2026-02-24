import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/history", "/saved-searches"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If route is protected and user is not logged in, redirect to sign in
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Only run middleware on protected routes
  matcher: ["/dashboard/:path*", "/history/:path*", "/saved-searches/:path*"],
};
