import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const DATAFORSEO_AUTH = Buffer.from("kyle@seobandwagon.com:d2844808853df619").toString("base64");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, limit = 100 } = body as { domain: string; limit?: number };

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    // Fetch keywords without volume data
    const rows = await db.execute(
      sql`SELECT keyword FROM tracked_keywords WHERE domain = ${domain} AND volume_updated_at IS NULL LIMIT ${limit}`
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ updated: 0, keywords: [] });
    }

    const keywords = rows.map((r: any) => r.keyword);

    // Batch into groups of 1000
    const batches: string[][] = [];
    for (let i = 0; i < keywords.length; i += 1000) {
      batches.push(keywords.slice(i, i + 1000));
    }

    const allResults: { keyword: string; search_volume: number | null; annual_volume: number | null }[] = [];

    for (const batch of batches) {
      const dfsResponse = await fetch(
        "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${DATAFORSEO_AUTH}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keywords: batch,
              location_code: 2840,
              language_code: "en",
            },
          ]),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!dfsResponse.ok) {
        throw new Error(`DataForSEO error: ${dfsResponse.status}`);
      }

      const dfsData = await dfsResponse.json();
      const results = dfsData?.tasks?.[0]?.result || [];

      for (const item of results) {
        const keyword = item.keyword;
        const vol = item.search_volume ?? null;
        const monthly = item.monthly_searches ?? [];
        const annual = monthly.length > 0
          ? monthly.reduce((sum: number, m: any) => sum + (m.search_volume ?? 0), 0)
          : null;
        const comp = item.competition_level ?? null;

        await db.execute(
          sql`UPDATE tracked_keywords SET search_volume = ${vol}, annual_volume = ${annual}, monthly_searches = ${JSON.stringify(monthly)}::jsonb, competition = ${comp}, volume_updated_at = NOW() WHERE domain = ${domain} AND keyword = ${keyword}`
        );

        allResults.push({ keyword, search_volume: vol, annual_volume: annual });
      }
    }

    return NextResponse.json({ updated: allResults.length, keywords: allResults });
  } catch (error) {
    console.error("Volume fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch volume" }, { status: 500 });
  }
}
