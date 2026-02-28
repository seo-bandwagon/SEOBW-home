import { NextRequest, NextResponse } from "next/server";
import { getSerpHistory } from "@/lib/db/queries";
import { isDatabaseConfigured } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const domain = searchParams.get("domain");
    const days = parseInt(searchParams.get("days") || "90", 10);

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: "keyword and domain query params are required" },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ history: [], message: "Database not configured" });
    }

    const history = await getSerpHistory(
      keyword.toLowerCase().trim(),
      domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, ""),
      days
    );

    return NextResponse.json({
      keyword: keyword.toLowerCase().trim(),
      domain: domain.toLowerCase().trim(),
      history: history.map((h) => ({
        position: h.position,
        url: h.url,
        recordedAt: h.recordedAt,
      })),
    });
  } catch (error) {
    console.error("Rank history API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rank history" },
      { status: 500 }
    );
  }
}
