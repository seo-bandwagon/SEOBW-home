import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSearchWithData, getUserSearches } from "@/lib/db/queries";

/**
 * GET /api/export?id=<searchId>        → export single search as CSV
 * GET /api/export?bulk=true&limit=100  → export all user searches as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const searchId = searchParams.get("id");
    const bulk = searchParams.get("bulk") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 1000);

    if (searchId) {
      return exportSingleSearch(searchId);
    }

    if (bulk) {
      return exportBulkHistory(session.user.id, limit);
    }

    return NextResponse.json(
      { error: "Provide ?id=<searchId> or ?bulk=true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function exportSingleSearch(searchId: string) {
  const search = await getSearchWithData(searchId);
  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  const inputType = search.inputType;
  const date = new Date(search.createdAt).toISOString().split("T")[0];
  const filename = `${inputType}-${search.inputValue.replace(/[^a-zA-Z0-9.-]/g, "_")}-${date}.csv`;

  if (inputType === "keyword" && search.keywordData?.length) {
    const kd = search.keywordData[0];
    const headers = ["Keyword", "Search Volume", "CPC Low", "CPC High", "CPC Avg", "Competition", "Difficulty", "Intent"];
    const mainRow = [kd.keyword, kd.searchVolume, kd.cpcLow, kd.cpcHigh, kd.cpcAvg, kd.competition, kd.difficulty, kd.searchIntent];
    const rows = [mainRow];

    // Add related keywords
    if (kd.relatedKeywords?.length) {
      rows.push([]); // blank separator
      rows.push(["Related Keywords", "Search Volume", "CPC", "Type"] as unknown as typeof mainRow);
      for (const rk of kd.relatedKeywords) {
        rows.push([rk.keyword, rk.searchVolume, rk.cpc, rk.keywordType] as unknown as typeof mainRow);
      }
    }

    return csvResponse(toCSV(headers, rows), filename);
  }

  if (inputType === "url" && search.domainData?.length) {
    const dd = search.domainData[0];
    const headers = ["Domain", "Domain Rank", "Backlinks", "Referring Domains", "Organic Traffic", "Organic Keywords"];
    const rows = [[dd.domain, dd.domainRank, dd.backlinkCount, dd.referringDomains, dd.organicTraffic, dd.organicKeywordsCount]];

    if (dd.rankedKeywords?.length) {
      rows.push([]);
      rows.push(["Ranked Keywords", "Position", "Search Volume", "URL"] as unknown as typeof rows[0]);
      for (const rk of dd.rankedKeywords) {
        rows.push([rk.keyword, rk.position, rk.searchVolume, rk.url] as unknown as typeof rows[0]);
      }
    }

    return csvResponse(toCSV(headers, rows), filename);
  }

  if ((inputType === "business" || inputType === "phone") && search.businessData?.length) {
    const bd = search.businessData[0];
    const headers = ["Business Name", "Address", "City", "State", "Zip", "Phone", "Website", "Category", "Rating", "Review Count"];
    const rows = [[bd.businessName, bd.address, bd.city, bd.state, bd.zip, bd.phone, bd.website, bd.category, bd.googleRating, bd.googleReviewCount]];
    return csvResponse(toCSV(headers, rows), filename);
  }

  // Fallback: basic info
  const headers = ["Type", "Query", "Date"];
  const rows = [[search.inputType, search.inputValue, new Date(search.createdAt).toISOString()]];
  return csvResponse(toCSV(headers, rows), filename);
}

async function exportBulkHistory(userId: string, limit: number) {
  const searches = await getUserSearches(userId, limit, 0);
  const date = new Date().toISOString().split("T")[0];
  const filename = `search-history-${date}.csv`;

  const headers = ["ID", "Type", "Query", "Normalized", "Date"];
  const rows = searches.map((s) => [
    s.id,
    s.inputType,
    s.inputValue,
    s.normalizedValue,
    new Date(s.createdAt).toISOString(),
  ]);

  return csvResponse(toCSV(headers, rows), filename);
}
