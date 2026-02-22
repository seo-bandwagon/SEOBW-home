import { NextRequest, NextResponse } from "next/server";
import {
  addTrackedKeyword,
  getTrackedKeywords,
  removeTrackedKeyword,
} from "@/lib/db/queries";
import { isDatabaseConfigured } from "@/lib/db/client";

/**
 * GET — list all tracked keywords
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ tracked: [], message: "Database not configured" });
  }

  try {
    const tracked = await getTrackedKeywords();
    return NextResponse.json({ tracked });
  } catch (error) {
    console.error("Failed to get tracked keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracked keywords" },
      { status: 500 }
    );
  }
}

/**
 * POST — add a keyword+domain to tracking
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

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

    const tracked = await addTrackedKeyword(
      keyword.toLowerCase().trim(),
      domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, ""),
      position
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
 * DELETE — remove a tracked keyword
 */
export async function DELETE(request: NextRequest) {
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
