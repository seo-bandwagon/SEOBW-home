import { NextRequest, NextResponse } from "next/server";
import { getInstantPage } from "@/lib/api/dataforseo/onpage";
import { getBacklinksSummary } from "@/lib/api/dataforseo/backlinks";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const domain = parsedUrl.hostname;

    // Run both analyses in parallel
    const [pageData, backlinkData] = await Promise.allSettled([
      getInstantPage(url),
      getBacklinksSummary(domain),
    ]);

    const page = pageData.status === "fulfilled" ? pageData.value : null;
    const backlinks = backlinkData.status === "fulfilled" ? backlinkData.value : null;

    // Extract link-relevant data from instant page
    const pageItem = page?.items?.[0];
    const linkData = pageItem
      ? {
          internalLinks: pageItem.meta?.internal_links_count ?? 0,
          externalLinks: pageItem.meta?.external_links_count ?? 0,
          inboundLinks: pageItem.meta?.inbound_links_count ?? 0,
          brokenLinks: pageItem.broken_links ?? false,
          onpageScore: pageItem.onpage_score ?? null,
          title: pageItem.meta?.title ?? "",
          statusCode: pageItem.status_code ?? null,
          checks: pageItem.checks ?? {},
        }
      : null;

    // Extract backlink summary
    const backlinkSummary = backlinks
      ? {
          totalBacklinks: backlinks.backlinks ?? 0,
          referringDomains: backlinks.referring_domains ?? 0,
          referringIps: backlinks.referring_ips ?? 0,
          domainRank: backlinks.rank ?? 0,
          spamScore: backlinks.backlinks_spam_score ?? 0,
          brokenBacklinks: backlinks.broken_backlinks ?? 0,
          referringDomainsNofollow: backlinks.referring_domains_nofollow ?? 0,
        }
      : null;

    return NextResponse.json({
      url,
      domain,
      page: linkData,
      backlinks: backlinkSummary,
    });
  } catch (error) {
    console.error("Link analyzer error:", error);
    return NextResponse.json(
      { error: "Failed to analyze links" },
      { status: 500 }
    );
  }
}
