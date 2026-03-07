import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

// GET /api/keywords - List all tracked keywords
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  try {
    const query = domain
      ? sql`SELECT * FROM tracked_keywords WHERE domain = ${domain} ORDER BY search_volume_monthly DESC NULLS LAST, keyword ASC`
      : sql`SELECT * FROM tracked_keywords ORDER BY domain ASC, search_volume_monthly DESC NULLS LAST, keyword ASC`;

    const keywords = await db.execute(query);
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}
