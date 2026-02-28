"use client";

import { KeywordResults } from "./KeywordResults";
import { DomainResults } from "./DomainResults";
import { BusinessResults } from "./BusinessResults";
import type { InputType } from "@/lib/parsers/inputParser";

interface CachedResultsRendererProps {
  search: {
    inputValue: string;
    normalizedValue: string | null;
    keywordData: Array<{
      keyword: string;
      searchVolume: number | null;
      cpcLow: string | null;
      cpcHigh: string | null;
      cpcAvg: string | null;
      competition: string | null;
      difficulty: number | null;
      searchIntent: string | null;
      trendData: unknown;
      relatedKeywords: Array<{
        keyword: string;
        searchVolume: number | null;
        cpc: string | null;
        keywordType: string | null;
      }>;
    }>;
    domainData: Array<{
      domain: string;
      domainRank: number | null;
      backlinkCount: number | null;
      referringDomains: number | null;
      organicTraffic: number | null;
      organicKeywordsCount: number | null;
      competitorDomains: unknown;
      whoisData: unknown;
      rankedKeywords: Array<{
        keyword: string;
        position: number | null;
        searchVolume: number | null;
        url: string | null;
      }>;
    }>;
    pageData: Array<{
      title: string | null;
      metaDescription: string | null;
      wordCount: number | null;
      internalLinks: number | null;
      externalLinks: number | null;
      images: number | null;
      lighthousePerformance: number | null;
      lighthouseAccessibility: number | null;
      lighthouseSeo: number | null;
      lighthouseBestPractices: number | null;
    }>;
    businessData: Array<{
      businessName: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      phone: string | null;
      website: string | null;
      category: string | null;
      googleRating: string | null;
      googleReviewCount: number | null;
      recentReviews: unknown;
      reviewSentiment: unknown;
    }>;
  };
  inputType: InputType;
  query: string;
  searchId: string;
}

export function CachedResultsRenderer({ search, inputType, query, searchId }: CachedResultsRendererProps) {
  if (inputType === "keyword") {
    const kd = search.keywordData?.[0];
    const data = {
      keyword: {
        keyword: kd?.keyword || search.inputValue,
        searchVolume: kd?.searchVolume ?? null,
        cpcLow: kd?.cpcLow ? Number(kd.cpcLow) : null,
        cpcHigh: kd?.cpcHigh ? Number(kd.cpcHigh) : null,
        cpcAvg: kd?.cpcAvg ? Number(kd.cpcAvg) : null,
        competition: kd?.competition ? Number(kd.competition) : null,
        difficulty: kd?.difficulty ?? null,
        monthlySearches: (kd?.trendData as Array<{ year: number; month: number; search_volume: number }>) || [],
      },
      relatedKeywords: (kd?.relatedKeywords || []).map((rk) => ({
        keyword: rk.keyword,
        searchVolume: rk.searchVolume ?? null,
        cpc: rk.cpc ? Number(rk.cpc) : null,
        type: rk.keywordType || "related",
      })),
      autocomplete: [] as string[],
      intent: kd?.searchIntent ? { label: kd.searchIntent, probability: 0 } : null,
      topUrls: [] as Array<{ url: string; domain: string; title: string; position: number }>,
    };
    return <KeywordResults data={data} query={query} searchId={searchId} />;
  }

  if (inputType === "url") {
    const dd = search.domainData?.[0];
    const pd = search.pageData?.[0];
    const data = {
      domain: {
        domain: dd?.domain || search.normalizedValue || search.inputValue,
        domainRank: dd?.domainRank ?? null,
        organicTraffic: dd?.organicTraffic ?? null,
        organicKeywords: dd?.organicKeywordsCount ?? null,
      },
      backlinks: {
        total: dd?.backlinkCount ?? 0,
        referringDomains: dd?.referringDomains ?? 0,
        dofollow: 0,
        nofollow: 0,
      },
      rankedKeywords: (dd?.rankedKeywords || []).map((rk) => ({
        keyword: rk.keyword,
        position: rk.position ?? 0,
        searchVolume: rk.searchVolume ?? null,
        url: rk.url || "",
      })),
      competitors: (dd?.competitorDomains as Array<{ domain: string; intersections: number; avgPosition: number }>) || [],
      lighthouse: pd ? {
        performance: pd.lighthousePerformance ?? 0,
        accessibility: pd.lighthouseAccessibility ?? 0,
        bestPractices: pd.lighthouseBestPractices ?? 0,
        seo: pd.lighthouseSeo ?? 0,
      } : null,
      pageAnalysis: pd ? {
        title: pd.title || "",
        metaDescription: pd.metaDescription || "",
        wordCount: pd.wordCount ?? 0,
        internalLinks: pd.internalLinks ?? 0,
        externalLinks: pd.externalLinks ?? 0,
        images: pd.images ?? 0,
      } : null,
      whois: (dd?.whoisData as { registrar: string; createdDate: string; expiryDate: string; nameServers: string[] }) || null,
    };
    return <DomainResults data={data} query={query} searchId={searchId} />;
  }

  if (inputType === "business" || inputType === "phone") {
    const bd = search.businessData?.[0];
    const data = {
      business: bd ? {
        name: bd.businessName || "",
        address: bd.address || "",
        city: bd.city || "",
        state: bd.state || "",
        zip: bd.zip || "",
        phone: bd.phone || "",
        website: bd.website || "",
        category: bd.category || "",
        rating: bd.googleRating ? Number(bd.googleRating) : null,
        reviewCount: bd.googleReviewCount ?? null,
        latitude: null as number | null,
        longitude: null as number | null,
        hours: null as Record<string, string> | null,
      } : null,
      reviews: bd?.recentReviews ? {
        rating: bd.googleRating ? Number(bd.googleRating) : 0,
        totalReviews: bd.googleReviewCount ?? 0,
        reviews: bd.recentReviews as Array<{ author: string; rating: number; text: string; date: string; profileImage: string | null }>,
        sentiment: (bd.reviewSentiment as { positive: number; negative: number; neutral: number }) || { positive: 0, negative: 0, neutral: 0 },
      } : null,
      maps: [] as Array<{ name: string; address: string; rating: number | null; reviewCount: number | null; category: string; phone: string; website: string }>,
    };
    return <BusinessResults data={data} query={query} searchId={searchId} />;
  }

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 text-center">
      <p className="text-slate-400">Unsupported search type: {inputType}</p>
    </div>
  );
}
