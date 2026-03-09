import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const site_url = searchParams.get("site_url") || "sc-domain:mastercontrolpress.com";

  try {
    const queries = await db.execute(
      sql`SELECT id, site_url, query, avg_position, impressions, clicks, ctr, date_range_start, date_range_end, fetched_at
          FROM gsc_query_data
          WHERE site_url = ${site_url}
          ORDER BY impressions DESC NULLS LAST`
    ) as any[];

    const totalImpressions = queries.reduce((sum: number, row: any) => sum + (row.impressions ?? 0), 0);
    const totalClicks = queries.reduce((sum: number, row: any) => sum + (row.clicks ?? 0), 0);

    return NextResponse.json({ queries, totalImpressions, totalClicks });
  } catch (error) {
    console.error("GSC queries error:", error);
    return NextResponse.json({ error: "Failed to fetch GSC data" }, { status: 500 });
  }
}
