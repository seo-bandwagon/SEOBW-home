import { NextRequest, NextResponse } from "next/server";

// This route handles the redirect back from api.seobandwagon.dev/auth/google/callback
// The email is passed as a query param after successful OAuth
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  
  if (!email) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", req.url));
  }

  // Redirect to dashboard with success
  return NextResponse.redirect(new URL("/dashboard/search-console?connected=true", req.url));
}
