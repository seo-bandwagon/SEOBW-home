import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const DATAFORSEO_AUTH = Buffer.from("kyle@seobandwagon.com:d2844808853df619").toString("base64");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "mastercontrolpress.com";

  try {
    const keywords = await db.execute(
      sql`SELECT * FROM tracked_keywords WHERE domain = ${domain} ORDER BY last_position ASC NULLS LAST, created_at DESC`
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
    const { domain, keywords } = body as { domain: string; keywords: string[] };

    if (!domain || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: "Missing domain or keywords" }, { status: 400 });
    }

    const batch = keywords.slice(0, 10);

    // Build DataForSEO request — all keywords in one array
    const requestBody = batch.map((kw) => ({
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
      }
    );

    if (!dfsResponse.ok) {
      throw new Error(`DataForSEO error: ${dfsResponse.status}`);
    }

    const dfsData = await dfsResponse.json();
    const tasks = dfsData.tasks || [];

    const results: { keyword: string; position: number | null }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const keyword = batch[i];
      const items = task?.result?.[0]?.items || [];

      // Find domain match
      const match = items.find(
        (item: any) =>
          item.type === "organic" &&
          item.domain &&
          item.domain.includes(domain.replace(/^www\./, ""))
      );

      const position: number | null = match ? match.rank_absolute : null;
      results.push({ keyword, position });

      // Update tracked_keywords
      await db.execute(
        sql`UPDATE tracked_keywords SET last_position = ${position}, last_checked_at = ${now} WHERE keyword = ${keyword} AND domain = ${domain}`
      );

      // Insert into serp_history
      await db.execute(
        sql`INSERT INTO serp_history (keyword, domain, position, url, recorded_at) VALUES (${keyword}, ${domain}, ${position}, ${match?.url || null}, ${now})`
      );
    }

    return NextResponse.json({ updated: results.length, results });
  } catch (error) {
    console.error("Rank tracker POST error:", error);
    return NextResponse.json({ error: "Failed to check positions" }, { status: 500 });
  }
}
