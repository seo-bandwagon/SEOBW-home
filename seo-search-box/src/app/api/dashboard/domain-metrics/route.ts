import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const DATAFORSEO_AUTH = Buffer.from("kyle@seobandwagon.com:d2844808853df619").toString("base64");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  try {
    const competitors = await db.execute(
      sql`SELECT competitor_domain, avg_position, intersections FROM domain_competitors WHERE domain = ${domain} ORDER BY intersections DESC LIMIT 10`
    ) as any[];

    const trafficRows = await db.execute(
      sql`SELECT organic_etv, organic_count FROM domain_traffic_estimates WHERE domain = ${domain} LIMIT 1`
    ) as any[];

    const traffic = trafficRows[0] || null;

    const relatedRows = await db.execute(
      sql`SELECT rk.related_keyword, rk.search_volume, rk.keyword_difficulty, rk.competition FROM related_keywords rk JOIN tracked_keywords tk ON rk.seed_keyword = tk.keyword WHERE tk.domain = ${domain} ORDER BY rk.search_volume DESC NULLS LAST LIMIT 100`
    ) as any[];

    return NextResponse.json({ competitors, traffic, relatedKeywords: relatedRows });
  } catch (error) {
    console.error("Domain metrics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch domain metrics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body as { domain: string };

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    // Fetch competitors from DataForSEO
    const compResponse = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DATAFORSEO_AUTH}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ target: domain, language_code: "en", location_code: 2840, limit: 20 }]),
        signal: AbortSignal.timeout(30000),
      }
    );

    let competitors: any[] = [];
    if (compResponse.ok) {
      const compData = await compResponse.json();
      competitors = compData?.tasks?.[0]?.result?.[0]?.items || [];

      // Save to DB (upsert)
      await db.execute(sql`DELETE FROM domain_competitors WHERE domain = ${domain}`);
      for (const comp of competitors) {
        await db.execute(
          sql`INSERT INTO domain_competitors (domain, competitor_domain, avg_position, intersections) VALUES (${domain}, ${comp.domain}, ${comp.avg_position ?? null}, ${comp.intersections ?? null})`
        );
      }
    }

    // Fetch traffic estimation from DataForSEO
    const trafficResponse = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_metrics_by_categories/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DATAFORSEO_AUTH}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ target: domain, language_code: "en", location_code: 2840 }]),
        signal: AbortSignal.timeout(30000),
      }
    );

    let traffic: any = null;
    if (trafficResponse.ok) {
      const trafficData = await trafficResponse.json();
      const metrics = trafficData?.tasks?.[0]?.result?.[0];
      if (metrics) {
        const etv = metrics.metrics?.organic?.etv ?? null;
        const count = metrics.metrics?.organic?.count ?? null;
        await db.execute(
          sql`INSERT INTO domain_traffic_estimates (domain, organic_etv, organic_count) VALUES (${domain}, ${etv}, ${count}) ON CONFLICT (domain) DO UPDATE SET organic_etv = EXCLUDED.organic_etv, organic_count = EXCLUDED.organic_count`
        );
        traffic = { organic_etv: etv, organic_count: count };
      }
    }

    // Fetch related keywords for top keywords
    const topKeywordsRows = await db.execute(
      sql`SELECT keyword FROM tracked_keywords WHERE domain = ${domain} ORDER BY search_volume DESC NULLS LAST LIMIT 10`
    ) as any[];
    const topKeywords = topKeywordsRows.map((r: any) => r.keyword);

    if (topKeywords.length > 0) {
      const relatedResponse = await fetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${DATAFORSEO_AUTH}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            topKeywords.map((kw) => ({ keyword: kw, language_code: "en", location_code: 2840, limit: 20 }))
          ),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (relatedResponse.ok) {
        const relatedData = await relatedResponse.json();
        const tasks = relatedData?.tasks || [];
        for (let i = 0; i < tasks.length; i++) {
          const seedKw = topKeywords[i];
          const items = tasks[i]?.result?.[0]?.items || [];
          for (const item of items) {
            const kw = item.keyword_data?.keyword;
            const vol = item.keyword_data?.keyword_info?.search_volume ?? null;
            const kd = item.keyword_data?.keyword_properties?.keyword_difficulty ?? null;
            const comp = item.keyword_data?.keyword_info?.competition ?? null;
            if (!kw) continue;
            await db.execute(
              sql`INSERT INTO related_keywords (seed_keyword, related_keyword, search_volume, keyword_difficulty, competition) VALUES (${seedKw}, ${kw}, ${vol}, ${kd}, ${comp}) ON CONFLICT (seed_keyword, related_keyword) DO UPDATE SET search_volume = EXCLUDED.search_volume, keyword_difficulty = EXCLUDED.keyword_difficulty, competition = EXCLUDED.competition`
            );
          }
        }
      }
    }

    return NextResponse.json({ competitors, traffic });
  } catch (error) {
    console.error("Domain metrics POST error:", error);
    return NextResponse.json({ error: "Failed to fetch domain metrics" }, { status: 500 });
  }
}
