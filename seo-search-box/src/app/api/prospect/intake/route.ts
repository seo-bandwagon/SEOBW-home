import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Extract domain from URL
    let domain: string;
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      domain = parsed.hostname.replace(/^www\./, "");
    } catch {
      // Fallback: strip protocol/www manually
      domain = url
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0];
    }

    const siteUrl = url.startsWith("http") ? url : `https://${url}`;
    const now = new Date().toISOString();

    // Upsert into prospect_analyses
    await db.execute(
      sql`INSERT INTO prospect_analyses (domain, site_url, intake_method, intake_url, intake_at)
          VALUES (${domain}, ${siteUrl}, 'browser_extension', ${siteUrl}, ${now})
          ON CONFLICT (domain) DO UPDATE SET
            site_url = EXCLUDED.site_url,
            intake_url = EXCLUDED.intake_url,
            intake_at = EXCLUDED.intake_at`
    );

    return NextResponse.json({ domain });
  } catch (error) {
    console.error("Prospect intake POST error:", error);
    return NextResponse.json({ error: "Failed to record prospect" }, { status: 500 });
  }
}
