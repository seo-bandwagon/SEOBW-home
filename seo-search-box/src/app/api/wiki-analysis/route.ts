import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const pages = await db.execute(sql`
      SELECT 
        slug, url, title,
        serp_keywords, keyword_count, est_traffic,
        external_links, external_link_count, internal_link_count,
        wayback_monthly_captures, wayback_first_capture, wayback_last_capture,
        wayback_first_url, wayback_latest_url, wayback_captures_by_year,
        created_at, updated_at
      FROM wiki_analysis_pages
      ORDER BY wayback_monthly_captures DESC
    `);

    // Aggregate stats
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_pages,
        SUM(wayback_monthly_captures) as total_captures,
        SUM(external_link_count) as total_external_links,
        SUM(keyword_count) as total_keywords,
        MIN(wayback_first_capture) as oldest_capture,
        AVG(wayback_monthly_captures) as avg_captures
      FROM wiki_analysis_pages
      WHERE wayback_monthly_captures > 0
    `);

    // Top external domains across all pages
    const domainCounts = await db.execute(sql`
      SELECT 
        link->>'domain' as domain,
        COUNT(*) as count
      FROM wiki_analysis_pages,
        jsonb_array_elements(external_links) as link
      WHERE jsonb_typeof(external_links) = 'array'
        AND jsonb_array_length(external_links) > 0
      GROUP BY link->>'domain'
      ORDER BY count DESC
      LIMIT 20
    `);

    return NextResponse.json({
      pages: pages,
      stats: (stats as unknown as Record<string, unknown>[])[0],
      topDomains: domainCounts,
    });
  } catch (error) {
    console.error("Wiki analysis API error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
