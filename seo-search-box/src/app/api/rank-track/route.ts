import { NextRequest, NextResponse } from "next/server";
import { getOrganicSerp } from "@/lib/api/dataforseo/serp";
import { recordSerpPosition } from "@/lib/db/queries";
import { isDatabaseConfigured } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, domain, locationCode = 2840 } = body as {
      keyword: string;
      domain: string;
      locationCode?: number;
    };

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: "keyword and domain are required" },
        { status: 400 }
      );
    }

    // Clean domain (strip protocol, www, trailing slash)
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/+$/, "")
      .toLowerCase();

    // Fetch organic SERP results
    const serpResult = await getOrganicSerp(keyword, locationCode, "en", 100) as Record<string, unknown> | null;

    if (!serpResult) {
      return NextResponse.json(
        { error: "Failed to fetch SERP data" },
        { status: 502 }
      );
    }

    const items = (serpResult.items as Record<string, unknown>[]) || [];

    // Find the domain in results
    let position: number | null = null;
    let rankingUrl: string | null = null;
    const organicItems = items.filter(
      (item: Record<string, unknown>) => item.type === "organic"
    );

    for (const item of organicItems) {
      const itemDomain = ((item as Record<string, unknown>).domain as string || "")
        .replace(/^www\./, "")
        .toLowerCase();

      if (
        itemDomain === cleanDomain ||
        itemDomain.endsWith(`.${cleanDomain}`) ||
        cleanDomain.endsWith(`.${itemDomain}`)
      ) {
        position = (item as Record<string, unknown>).rank_group as number;
        rankingUrl = (item as Record<string, unknown>).url as string;
        break;
      }
    }

    // Save to DB if configured
    if (isDatabaseConfigured()) {
      try {
        await recordSerpPosition(
          keyword.toLowerCase().trim(),
          cleanDomain,
          position,
          rankingUrl || undefined
        );
      } catch (dbError) {
        console.error("Failed to save rank check:", dbError);
      }
    }

    // Build top 10 for context
    const topResults = organicItems.slice(0, 10).map((item: Record<string, unknown>) => ({
      position: item.rank_group as number,
      domain: item.domain as string,
      url: item.url as string,
      title: item.title as string,
    }));

    return NextResponse.json({
      keyword: keyword.toLowerCase().trim(),
      domain: cleanDomain,
      position,
      url: rankingUrl,
      totalResults: organicItems.length,
      topResults,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Rank track API error:", error);
    return NextResponse.json(
      {
        error: "Rank check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
