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
    const page = await db.execute(sql`
      SELECT * FROM wiki_analysis_pages WHERE slug = ${slug}
    `);
    if (!page.length) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Link snapshots over time
    const snapshots = await db.execute(sql`
      SELECT 
        snapshot_date, snapshot_timestamp, wayback_url,
        external_link_count, internal_link_count,
        external_domains, title, word_count, h1, h2,
        meta_description, text_preview
      FROM wiki_link_snapshots
      WHERE slug = ${slug}
      ORDER BY snapshot_date ASC
    `);

    // Link changes between snapshots
    const changes = await db.execute(sql`
      SELECT 
        from_date, to_date, from_timestamp, to_timestamp,
        links_added, links_removed, domains_added, domains_removed,
        links_added_count, links_removed_count,
        word_count_before, word_count_after,
        h2_before, h2_after
      FROM wiki_link_changes
      WHERE slug = ${slug}
      ORDER BY from_date ASC
    `);

    // Content history (from earlier analysis)
    const history = await db.execute(sql`
      SELECT 
        snapshot_date, snapshot_timestamp, wayback_url,
        title, word_count, h1, h2,
        link_count_internal, link_count_external, text_preview
      FROM wiki_page_history
      WHERE slug = ${slug}
      ORDER BY snapshot_date ASC
    `);

    return NextResponse.json({
      page: (page as unknown as Record<string, unknown>[])[0],
      snapshots,
      changes,
      history,
    });
  } catch (error) {
    console.error("Wiki detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
