import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addTrackedKeyword,
  getTrackedKeywords,
  removeTrackedKeyword,
} from "@/lib/db/queries";
import { isDatabaseConfigured } from "@/lib/db/client";

/**
 * GET — list tracked keywords for the logged-in user
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to track keywords" },
      { status: 401 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ tracked: [], message: "Database not configured" });
  }

  try {
    const tracked = await getTrackedKeywords(session.user.id);
    return NextResponse.json({ tracked, limit: 10, remaining: Math.max(0, 10 - tracked.length) });
  } catch (error) {
    console.error("Failed to get tracked keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracked keywords" },
      { status: 500 }
    );
  }
}

/**
 * POST — add a keyword+domain to tracking (requires auth)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to track keywords" },
      { status: 401 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const MAX_TRACKED_KEYWORDS = 10;

  try {
    const body = await request.json();
    const { keyword, domain, position } = body as {
      keyword: string;
      domain: string;
      position?: number | null;
    };

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: "keyword and domain are required" },
        { status: 400 }
      );
    }

    // Check if user is at the limit
    const existing = await getTrackedKeywords(session.user.id);
    const cleanKeyword = keyword.toLowerCase().trim();
    const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, "");
    const alreadyTracked = existing.some(
      (t) => t.keyword === cleanKeyword && t.domain === cleanDomain
    );

    if (!alreadyTracked && existing.length >= MAX_TRACKED_KEYWORDS) {
      return NextResponse.json(
        {
          error: `Free accounts can track up to ${MAX_TRACKED_KEYWORDS} keywords. Remove a keyword or upgrade to track more.`,
          limit: MAX_TRACKED_KEYWORDS,
          current: existing.length,
        },
        { status: 403 }
      );
    }

    const tracked = await addTrackedKeyword(
      keyword.toLowerCase().trim(),
      domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, ""),
      position,
      session.user.id
    );

    return NextResponse.json({ tracked });
  } catch (error) {
    console.error("Failed to add tracked keyword:", error);
    return NextResponse.json(
      { error: "Failed to add tracked keyword" },
      { status: 500 }
    );
  }
}

/**
 * DELETE — remove a tracked keyword (requires auth)
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await removeTrackedKeyword(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove tracked keyword:", error);
    return NextResponse.json(
      { error: "Failed to remove tracked keyword" },
      { status: 500 }
    );
  }
}
