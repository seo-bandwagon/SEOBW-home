import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";

// CTR curve by position
function getCTR(position: number | null | undefined): number {
  if (!position) return 0.005;
  switch (position) {
    case 1: return 0.284;
    case 2: return 0.157;
    case 3: return 0.110;
    case 4: return 0.082;
    case 5: return 0.064;
    case 6: return 0.050;
    case 7: return 0.040;
    case 8: return 0.034;
    case 9: return 0.030;
    case 10: return 0.025;
    default:
      if (position >= 11 && position <= 20) return 0.010;
      return 0.005;
  }
}

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "mastercontrolpress.com";

  try {
    const rows = await db.execute(sql`
      SELECT
        keyword,
        target_url,
        pillar,
        volume,
        cpc,
        difficulty,
        target_position,
        intent,
        domain
      FROM tracked_keywords
      WHERE domain = ${domain}
      ORDER BY keyword ASC
    `);

    type RawRow = Record<string, unknown>;
    const data = (rows as RawRow[]).map((row: RawRow) => {
      const volume = Number(row.volume) || 0;
      const cpc = row.cpc != null ? Number(row.cpc) : 0;
      const targetPosition = row.target_position != null ? Number(row.target_position) : null;
      const ctr = getCTR(targetPosition);
      const et = Math.round(volume * ctr);
      const ev = parseFloat((et * cpc).toFixed(2));

      return {
        keyword: row.keyword,
        target_url: row.target_url ?? null,
        pillar: row.pillar ?? null,
        volume,
        cpc: cpc,
        difficulty: row.difficulty != null ? Number(row.difficulty) : null,
        target_position: targetPosition,
        intent: row.intent ?? null,
        domain: row.domain,
        et,
        ev,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Content plan query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch content plan data" },
      { status: 500 }
    );
  }
}
