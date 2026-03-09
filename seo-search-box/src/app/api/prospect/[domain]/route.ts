import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

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

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Prospect GET error:", error);
    return NextResponse.json({ error: "Failed to fetch prospect" }, { status: 500 });
  }
}
