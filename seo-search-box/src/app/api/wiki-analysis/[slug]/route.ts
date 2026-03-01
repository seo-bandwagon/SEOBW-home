import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Page overview
    const pageRows = await db.execute(sql`
      SELECT * FROM wiki_analysis_pages WHERE slug = ${slug}
    `);
    if (!pageRows.length) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Revision stats
    const revStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_revisions,
        MIN(timestamp) as first_revision,
        MAX(timestamp) as last_revision,
        MIN(size) as min_size,
        MAX(size) as max_size
      FROM wiki_revisions WHERE slug = ${slug}
    `);

    // Revision size over time (sampled — one per month for chart)
    const revTimeline = await db.execute(sql`
      SELECT 
        date_trunc('month', timestamp)::date as month,
        MAX(size) as size,
        COUNT(*) as edits
      FROM wiki_revisions WHERE slug = ${slug}
      GROUP BY month ORDER BY month
    `);

    // Deep snapshots with links/sections
    const snapshots = await db.execute(sql`
      SELECT 
        revid, snapshot_date, size, sections, section_count,
        external_links, external_link_count, external_domains, domain_count
      FROM wiki_revision_snapshots
      WHERE slug = ${slug}
      ORDER BY snapshot_date ASC
    `);

    // Link diffs between snapshots
    const linkDiffs = await db.execute(sql`
      SELECT 
        from_revid, to_revid, from_date, to_date,
        links_added, links_removed, domains_added, domains_removed,
        links_added_count, links_removed_count,
        size_before, size_after, sections_before, sections_after
      FROM wiki_revision_link_diffs
      WHERE slug = ${slug}
      ORDER BY from_date ASC
    `);

    // Top edited periods (months with most revisions)
    const editHotspots = await db.execute(sql`
      SELECT 
        date_trunc('month', timestamp)::date as month,
        COUNT(*) as edit_count,
        SUM(ABS(size_delta)) as total_change
      FROM wiki_revisions WHERE slug = ${slug}
      GROUP BY month
      ORDER BY edit_count DESC
      LIMIT 10
    `);

    // Biggest single edits
    const bigEdits = await db.execute(sql`
      SELECT revid, timestamp, size, size_delta, comment
      FROM wiki_revisions WHERE slug = ${slug}
      ORDER BY ABS(size_delta) DESC
      LIMIT 15
    `);

    return NextResponse.json({
      page: (pageRows as unknown as Record<string, unknown>[])[0],
      revisionStats: (revStats as unknown as Record<string, unknown>[])[0],
      revisionTimeline: revTimeline,
      snapshots,
      linkDiffs,
      editHotspots,
      bigEdits,
    });
  } catch (error) {
    console.error("Wiki detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
