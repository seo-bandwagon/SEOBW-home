import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { extractSchema } from "@/lib/schema-extractor";

export async function GET(
  _request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const { domain } = params;

    const rows = await db.execute(
      sql`SELECT * FROM prospect_analyses WHERE domain = ${domain} LIMIT 1`
    ) as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const prospect = rows[0];

    // Auto-extract schema if not yet cached
    if (!prospect.schema_data && prospect.site_url) {
      try {
        const blocks = await extractSchema(prospect.site_url);
        if (blocks.length > 0) {
          await db.execute(
            sql`UPDATE prospect_analyses SET schema_data = ${JSON.stringify(blocks)}::jsonb WHERE domain = ${domain}`
          );
          prospect.schema_data = blocks;
        }
      } catch {
        // Non-fatal — schema extraction failure doesn't break the report
      }
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("Prospect GET error:", error);
    return NextResponse.json({ error: "Failed to fetch prospect" }, { status: 500 });
  }
}
