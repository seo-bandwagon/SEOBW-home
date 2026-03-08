import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const DATAFORSEO_AUTH = Buffer.from("kyle@seobandwagon.com:d2844808853df619").toString("base64");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body as { domain: string };

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    // Fetch all keywords for this domain
    const kwRows = await db.execute(
      sql`SELECT keyword FROM tracked_keywords WHERE domain = ${domain}`
    ) as any[];

    const keywords: string[] = kwRows.map((r: any) => r.keyword);

    if (keywords.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    let totalUpdated = 0;
    const CHUNK = 1000;

    for (let offset = 0; offset < keywords.length; offset += CHUNK) {
      const chunk = keywords.slice(offset, offset + CHUNK);

      const dfsResponse = await fetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${DATAFORSEO_AUTH}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ keywords: chunk, language_code: "en", location_code: 2840 }]),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!dfsResponse.ok) {
        console.error(`DataForSEO difficulty error: ${dfsResponse.status}`);
        continue;
      }

      const dfsData = await dfsResponse.json();
      const items: any[] = dfsData?.tasks?.[0]?.result?.[0]?.items || [];

      for (const item of items) {
        const kw: string = item.keyword;
        const difficulty: number = item.keyword_difficulty;
        await db.execute(
          sql`UPDATE tracked_keywords SET keyword_difficulty = ${difficulty} WHERE keyword = ${kw} AND domain = ${domain}`
        );
        totalUpdated++;
      }
    }

    return NextResponse.json({ updated: totalUpdated });
  } catch (error) {
    console.error("Keyword difficulty POST error:", error);
    return NextResponse.json({ error: "Failed to fetch keyword difficulty" }, { status: 500 });
  }
}
