import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const DATAFORSEO_AUTH = Buffer.from("kyle@seobandwagon.com:d2844808853df619").toString("base64");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "mastercontrolpress.com";

  try {
    const keywords = await db.execute(
      sql`SELECT id, keyword, domain, last_position, last_checked_at, search_volume_monthly AS search_volume, search_volume_annual AS annual_volume, monthly_searches, competition, competition_index, cpc, low_top_of_page_bid, high_top_of_page_bid, keyword_difficulty, volume_updated_at, created_at FROM tracked_keywords WHERE domain = ${domain} ORDER BY last_position ASC NULLS LAST, created_at DESC`
    ) as any[];

    const ranked = keywords.filter((k: any) => k.last_position !== null);
    const top10 = ranked.filter((k: any) => k.last_position <= 10);
    const top3 = ranked.filter((k: any) => k.last_position <= 3);
    const avgPosition =
      ranked.length > 0
        ? Math.round(ranked.reduce((sum: number, k: any) => sum + k.last_position, 0) / ranked.length)
        : null;

    // Also get distinct domains for selector
    const domainsResult = await db.execute(
      sql`SELECT DISTINCT domain FROM tracked_keywords ORDER BY domain`
    ) as any[];

    return NextResponse.json({
      keywords,
      domain,
      domains: domainsResult.map((r: any) => r.domain),
      stats: {
        total: keywords.length,
        ranked: ranked.length,
        notRanked: keywords.length - ranked.length,
        avgPosition,
        top10: top10.length,
        top3: top3.length,
        totalVolume: keywords.reduce((sum: number, k: any) => sum + (k.search_volume ?? 0), 0),
        avgVolume: keywords.filter((k: any) => k.search_volume !== null).length > 0
          ? Math.round(keywords.filter((k: any) => k.search_volume !== null).reduce((sum: number, k: any) => sum + k.search_volume, 0) / keywords.filter((k: any) => k.search_volume !== null).length)
          : null,
      },
    });
  } catch (error) {
    console.error("Rank tracker GET error:", error);
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, keywords, checkAll } = body as { domain: string; keywords?: string[]; checkAll?: boolean };

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    let batch: string[];

    if (checkAll) {
      // Fetch all unchecked keywords for this domain from DB
      const unchecked = await db.execute(
        sql`SELECT keyword FROM tracked_keywords WHERE domain = ${domain} AND last_checked_at IS NULL ORDER BY created_at DESC`
      ) as any[];
      batch = unchecked.map((r: any) => r.keyword);
    } else {
      if (!keywords || keywords.length === 0) {
        return NextResponse.json({ error: "Missing keywords" }, { status: 400 });
      }
      batch = keywords.slice(0, 10);
    }

    const results: { keyword: string; position: number | null }[] = [];
    const now = new Date().toISOString();
    const CHUNK = 10;

    // Process in chunks of 10 (DataForSEO SERP live endpoint limit)
    for (let offset = 0; offset < batch.length; offset += CHUNK) {
      const chunk = batch.slice(offset, offset + CHUNK);

      const requestBody = chunk.map((kw) => ({
        keyword: kw,
        location_code: 2840,
        language_code: "en",
        device: "desktop",
        depth: 100,
      }));

      const dfsResponse = await fetch(
        "https://api.dataforseo.com/v3/serp/google/organic/live/regular",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${DATAFORSEO_AUTH}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!dfsResponse.ok) {
        console.error(`DataForSEO error on chunk ${offset}: ${dfsResponse.status}`);
        continue;
      }

      const dfsData = await dfsResponse.json();
      const tasks = dfsData.tasks || [];

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const keyword = chunk[i];
        const items = task?.result?.[0]?.items || [];

        const match = items.find(
          (item: any) =>
            item.type === "organic" &&
            item.domain &&
            item.domain.includes(domain.replace(/^www\./, ""))
        );

        const position: number | null = match ? match.rank_absolute : null;
        results.push({ keyword, position });

        await db.execute(
          sql`UPDATE tracked_keywords SET last_position = ${position}, last_checked_at = ${now} WHERE keyword = ${keyword} AND domain = ${domain}`
        );

        await db.execute(
          sql`INSERT INTO serp_history (keyword, domain, position, url, recorded_at) VALUES (${keyword}, ${domain}, ${position}, ${match?.url || null}, ${now})`
        );
      }
    }

    return NextResponse.json({ updated: results.length, results });
  } catch (error) {
    console.error("Rank tracker POST error:", error);
    return NextResponse.json({ error: "Failed to check positions" }, { status: 500 });
  }
}
