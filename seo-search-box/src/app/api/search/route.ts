import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseInput, type InputType } from "@/lib/parsers/inputParser";
import {
  getSearchVolume,
  getKeywordSuggestions,
  getSearchIntent,
  getAutocomplete,
  getBacklinksSummary,
  getRankedKeywords,
  getCompetitorDomains,
  getLighthouseAudit,
  getInstantPage,
  getWhois,
  getGoogleMaps,
  getGoogleReviews,
  getBusinessInfo,
} from "@/lib/api/dataforseo";
import {
  withCache,
  generateCacheKey,
  CACHE_PREFIX,
  CACHE_TTL,
} from "@/lib/cache";
import {
  saveSearch,
  saveKeywordSearchResults,
  saveDomainSearchResults,
  saveBusinessSearchResults,
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type } = body as { query: string; type?: InputType };

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Parse input to determine type if not provided
    const parsed = parseInput(query);
    const inputType = type || parsed.type;

    // Get session for user tracking (optional)
    const session = await auth();

    // Generate cache key based on input type and normalized query
    const normalizedQuery = parsed.normalized || query;
    const cacheKey = generateCacheKey(CACHE_PREFIX.SEARCH, inputType, normalizedQuery);

    // Execute search with caching
    const results = await withCache(
      cacheKey,
      inputType === "keyword" ? CACHE_TTL.KEYWORD_DATA : CACHE_TTL.DOMAIN_DATA,
      async () => {
        switch (inputType) {
          case "keyword":
            return await searchKeyword(query);
          case "url":
            return await searchDomain(normalizedQuery);
          case "business":
            return await searchBusiness(query);
          case "phone":
            return await searchPhone(query);
          case "address":
            return await searchAddress(query);
          default:
            return await searchKeyword(query);
        }
      }
    );

    // Save search to database if user is logged in
    let searchId: string | null = null;
    if (session?.user?.id) {
      try {
        const savedSearch = await saveSearch({
          userId: session.user.id,
          inputType,
          inputValue: query,
          normalizedValue: parsed.normalized,
        });
        searchId = savedSearch.id;

        // Save detailed results based on input type
        await persistSearchResults(searchId, inputType, results, normalizedQuery);
      } catch (dbError) {
        // Log but don't fail the request if DB save fails
        console.error("Failed to save search to database:", dbError);
      }
    }

    return NextResponse.json({
      ...results,
      searchId,
      inputType,
      query,
      normalizedQuery,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Persist search results to database
 */
async function persistSearchResults(
  searchId: string,
  inputType: InputType,
  results: Record<string, unknown>,
  normalizedQuery: string
) {
  switch (inputType) {
    case "keyword": {
      const keywordResults = results as {
        keyword: {
          keyword: string;
          searchVolume: number | null;
          cpcLow: number | null;
          cpcHigh: number | null;
          cpcAvg: number | null;
          competition: number | null;
          difficulty: number | null;
          monthlySearches: Array<{ month: number; year: number; search_volume: number }>;
        };
        relatedKeywords: Array<{
          keyword: string;
          searchVolume: number | null;
          cpc: number | null;
          type: string;
        }>;
        intent: { label: string; probability: number } | null;
      };

      await saveKeywordSearchResults(searchId, {
        keyword: {
          searchId,
          keyword: keywordResults.keyword.keyword,
          searchVolume: keywordResults.keyword.searchVolume,
          cpcLow: keywordResults.keyword.cpcLow,
          cpcHigh: keywordResults.keyword.cpcHigh,
          cpcAvg: keywordResults.keyword.cpcAvg,
          competition: keywordResults.keyword.competition,
          difficulty: keywordResults.keyword.difficulty,
          searchIntent: keywordResults.intent?.label,
          trendData: keywordResults.keyword.monthlySearches,
        },
        relatedKeywords: keywordResults.relatedKeywords.map((kw) => ({
          keyword: kw.keyword,
          searchVolume: kw.searchVolume,
          cpc: kw.cpc,
          keywordType: kw.type,
        })),
      });
      break;
    }

    case "url": {
      const domainResults = results as {
        domain: {
          domain: string;
          domainRank: number | null;
          organicTraffic: number | null;
          organicKeywords: number;
        };
        backlinks: {
          total: number;
          referringDomains: number;
        };
        rankedKeywords: Array<{
          keyword: string;
          position: number;
          searchVolume: number | null;
          url: string;
        }>;
        competitors: Array<{
          domain: string;
          intersections: number;
          avgPosition: number;
        }>;
        lighthouse: {
          performance: number;
          accessibility: number;
          bestPractices: number;
          seo: number;
        } | null;
        pageAnalysis: {
          title: string;
          metaDescription: string;
          wordCount: number;
          internalLinks: number;
          externalLinks: number;
          images: number;
        } | null;
        whois: {
          registrar: string;
          createdDate: string;
          expiryDate: string;
          nameServers: string[];
        } | null;
      };

      await saveDomainSearchResults(searchId, {
        domain: {
          searchId,
          domain: domainResults.domain.domain,
          domainRank: domainResults.domain.domainRank,
          backlinkCount: domainResults.backlinks.total,
          referringDomains: domainResults.backlinks.referringDomains,
          organicTraffic: domainResults.domain.organicTraffic,
          organicKeywordsCount: domainResults.domain.organicKeywords,
          competitorDomains: domainResults.competitors,
          whoisData: domainResults.whois,
        },
        rankedKeywords: domainResults.rankedKeywords.map((kw) => ({
          keyword: kw.keyword,
          position: kw.position,
          searchVolume: kw.searchVolume,
          url: kw.url,
        })),
        pageAnalysis: domainResults.pageAnalysis
          ? {
              searchId,
              url: `https://${domainResults.domain.domain}`,
              title: domainResults.pageAnalysis.title,
              metaDescription: domainResults.pageAnalysis.metaDescription,
              wordCount: domainResults.pageAnalysis.wordCount,
              internalLinks: domainResults.pageAnalysis.internalLinks,
              externalLinks: domainResults.pageAnalysis.externalLinks,
              images: domainResults.pageAnalysis.images,
              lighthousePerformance: domainResults.lighthouse?.performance,
              lighthouseAccessibility: domainResults.lighthouse?.accessibility,
              lighthouseSeo: domainResults.lighthouse?.seo,
              lighthouseBestPractices: domainResults.lighthouse?.bestPractices,
            }
          : undefined,
      });
      break;
    }

    case "business":
    case "phone": {
      const businessResults = results as {
        business: {
          name: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          phone: string;
          website: string;
          category: string;
          rating: number | null;
          reviewCount: number | null;
        } | null;
        reviews?: {
          rating: number;
          totalReviews: number;
          reviews: Array<{
            author: string;
            rating: number;
            text: string;
            date: string;
          }>;
          sentiment: {
            positive: number;
            negative: number;
            neutral: number;
          };
        } | null;
      };

      if (businessResults.business) {
        await saveBusinessSearchResults(searchId, {
          searchId,
          businessName: businessResults.business.name,
          address: businessResults.business.address,
          city: businessResults.business.city,
          state: businessResults.business.state,
          zip: businessResults.business.zip,
          phone: businessResults.business.phone,
          website: businessResults.business.website,
          category: businessResults.business.category,
          googleRating: businessResults.business.rating,
          googleReviewCount: businessResults.business.reviewCount,
          recentReviews: businessResults.reviews?.reviews,
          reviewSentiment: businessResults.reviews?.sentiment,
        });
      }
      break;
    }
  }
}

/**
 * Search for keyword data
 */
async function searchKeyword(keyword: string) {
  // Run multiple API calls in parallel
  const [volumeData, suggestions, intentData, autocompleteData] = await Promise.allSettled([
    getSearchVolume([keyword]),
    getKeywordSuggestions(keyword),
    getSearchIntent([keyword]),
    getAutocomplete(keyword),
  ]);

  // Extract results safely
  const volume = volumeData.status === "fulfilled" ? volumeData.value[0] : null;
  const related = suggestions.status === "fulfilled" ? suggestions.value : [];
  const intent = intentData.status === "fulfilled" ? intentData.value[0] : null;
  const autocomplete = autocompleteData.status === "fulfilled"
    ? autocompleteData.value?.items?.map((item) => item.suggestion) || []
    : [];

  // NOTE: DataForSEO Google Ads search_volume/live returns keyword metrics at the
  // ROOT level of each result (e.g. volume.search_volume), not nested under keyword_info.
  // Verified against live API on 2026-02-21.
  return {
    keyword: {
      keyword,
      searchVolume: volume?.search_volume ?? null,
      cpcLow: volume?.low_top_of_page_bid ?? null,
      cpcHigh: volume?.high_top_of_page_bid ?? null,
      cpcAvg: volume?.cpc ?? null,
      competition: volume?.competition ?? null,
      difficulty: null, // Would need separate API call
      monthlySearches: volume?.monthly_searches || [],
    },
    // NOTE: keywords_for_keywords/live also returns metrics at root level, not under keyword_info.
    relatedKeywords: related.slice(0, 50).map((kw) => ({
      keyword: kw.keyword,
      searchVolume: kw.search_volume ?? null,
      cpc: kw.cpc ?? null,
      type: "related",
    })),
    autocomplete,
    intent: intent
      ? {
          label: intent.keyword_intent?.label || "unknown",
          probability: intent.keyword_intent?.probability || 0,
        }
      : null,
    topUrls: [], // Would need SERP API call
  };
}

/**
 * Search for domain/URL data
 */
async function searchDomain(domain: string) {
  // Clean domain
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  const fullUrl = `https://${cleanDomain}`;

  // Run multiple API calls in parallel
  const [backlinksData, rankedData, competitorsData, lighthouseData, pageData, whoisData] =
    await Promise.allSettled([
      getBacklinksSummary(cleanDomain),
      getRankedKeywords(cleanDomain, 2840, "en", 50),
      getCompetitorDomains(cleanDomain),
      getLighthouseAudit(fullUrl),
      getInstantPage(fullUrl),
      getWhois(cleanDomain),
    ]);

  // Extract results safely
  const backlinks = backlinksData.status === "fulfilled" ? backlinksData.value : null;
  const ranked = rankedData.status === "fulfilled" ? rankedData.value : [];
  const competitors = competitorsData.status === "fulfilled" ? competitorsData.value : [];
  const lighthouse = lighthouseData.status === "fulfilled" ? lighthouseData.value : null;
  const page = pageData.status === "fulfilled" ? pageData.value : null;
  const whois = whoisData.status === "fulfilled" ? whoisData.value : null;

  // Extract lighthouse scores
  const lighthouseScores = lighthouse?.items?.[0]?.categories;

  // Extract page analysis
  const pageItem = page?.items?.[0];

  return {
    domain: {
      domain: cleanDomain,
      domainRank: backlinks?.rank || null,
      organicTraffic: null, // Would need labs API
      organicKeywords: ranked.length,
    },
    backlinks: {
      total: backlinks?.backlinks || 0,
      referringDomains: backlinks?.referring_domains || 0,
      dofollow: backlinks?.referring_links_attributes?.["nofollow"]
        ? (backlinks?.backlinks || 0) - (backlinks?.referring_links_attributes?.["nofollow"] || 0)
        : backlinks?.backlinks || 0,
      nofollow: backlinks?.referring_links_attributes?.["nofollow"] || 0,
    },
    rankedKeywords: ranked.slice(0, 50).map((kw) => ({
      keyword: kw.keyword_data?.keyword || "",
      position: kw.ranked_serp_element?.serp_item?.rank_group || 0,
      searchVolume: kw.keyword_data?.keyword_info?.search_volume || null,
      url: kw.ranked_serp_element?.serp_item?.url || "",
    })),
    competitors: competitors.slice(0, 20).map((comp) => ({
      domain: comp.domain,
      intersections: comp.intersections,
      avgPosition: comp.avg_position,
    })),
    lighthouse: lighthouseScores
      ? {
          performance: Math.round((lighthouseScores.performance?.score || 0) * 100),
          accessibility: Math.round((lighthouseScores.accessibility?.score || 0) * 100),
          bestPractices: Math.round((lighthouseScores.best_practices?.score || 0) * 100),
          seo: Math.round((lighthouseScores.seo?.score || 0) * 100),
        }
      : null,
    pageAnalysis: pageItem
      ? {
          title: pageItem.meta?.title || "",
          metaDescription: pageItem.meta?.description || "",
          wordCount: pageItem.meta?.content?.plain_text_word_count || 0,
          internalLinks: pageItem.meta?.internal_links_count || 0,
          externalLinks: pageItem.meta?.external_links_count || 0,
          images: pageItem.meta?.images_count || 0,
        }
      : null,
    whois: whois
      ? {
          registrar: whois.registrar?.name || "",
          createdDate: whois.created_datetime || "",
          expiryDate: whois.expiration_datetime || "",
          nameServers: whois.name_servers || [],
        }
      : null,
  };
}

/**
 * Search for business data
 */
async function searchBusiness(businessName: string) {
  // Run API calls in parallel
  const [mapsData, businessData, reviewsData] = await Promise.allSettled([
    getGoogleMaps(businessName),
    getBusinessInfo(businessName),
    getGoogleReviews(businessName, 2840, "en", 50),
  ]);

  // Extract results
  const maps = mapsData.status === "fulfilled" ? mapsData.value : null;
  const business = businessData.status === "fulfilled" ? businessData.value : null;
  const reviews = reviewsData.status === "fulfilled" ? reviewsData.value : null;

  // Get the first maps item for location data
  const firstMapsItem = maps?.items?.[0];

  // Merge business info with maps data — BusinessInfo API often returns sparse results,
  // so we fill gaps from the richer Google Maps data
  const biz = business;
  const mp = firstMapsItem;

  return {
    business: (biz || mp)
      ? {
          name: biz?.title || mp?.title || businessName,
          address: biz?.address || mp?.address || "",
          city: biz?.address_info?.city || mp?.address_info?.city || "",
          state: biz?.address_info?.region || mp?.address_info?.region || "",
          zip: biz?.address_info?.zip || mp?.address_info?.zip || "",
          phone: biz?.phone || mp?.phone || "",
          website: biz?.url || mp?.url || "",
          category: biz?.category || mp?.category || "",
          rating: biz?.rating?.value ?? mp?.rating?.value ?? null,
          reviewCount: biz?.rating?.votes_count ?? mp?.rating?.votes_count ?? null,
          latitude: biz?.latitude || mp?.latitude || null,
          longitude: biz?.longitude || mp?.longitude || null,
          placeId: biz?.place_id || mp?.place_id || null,
          cid: biz?.cid || mp?.cid || null,
          hours: null,
        }
      : null,
    reviews: reviews
      ? {
          rating: reviews.rating?.value || 0,
          totalReviews: reviews.reviews_count || 0,
          reviews: (reviews.items || []).slice(0, 20).map((r) => ({
            author: r.profile_name || "Anonymous",
            rating: r.rating?.value || 0,
            text: r.review_text || "",
            date: r.timestamp || "",
            profileImage: r.profile_image_url || null,
          })),
          sentiment: {
            positive: (reviews.items || []).filter((r) => (r.rating?.value || 0) >= 4).length,
            negative: (reviews.items || []).filter((r) => (r.rating?.value || 0) <= 2).length,
            neutral: (reviews.items || []).filter(
              (r) => (r.rating?.value || 0) === 3
            ).length,
          },
        }
      : null,
    maps: (maps?.items || []).map((item) => ({
      name: item.title,
      address: item.address,
      rating: item.rating?.value || null,
      reviewCount: item.rating?.votes_count || null,
      category: item.category,
      phone: item.phone,
      website: item.url,
      latitude: item.latitude || null,
      longitude: item.longitude || null,
      placeId: item.place_id || null,
      cid: item.cid || null,
    })),
  };
}

/**
 * Search for phone number data
 */
async function searchPhone(phone: string) {
  // Use Google Maps search with phone number
  const [mapsData] = await Promise.allSettled([getGoogleMaps(phone)]);

  const maps = mapsData.status === "fulfilled" ? mapsData.value : null;
  const firstResult = maps?.items?.[0];

  return {
    business: firstResult
      ? {
          name: firstResult.title,
          address: firstResult.address,
          city: firstResult.address_info?.city || "",
          state: firstResult.address_info?.region || "",
          zip: firstResult.address_info?.zip || "",
          phone: firstResult.phone || phone,
          website: firstResult.url || "",
          category: firstResult.category || "",
          rating: firstResult.rating?.value || null,
          reviewCount: firstResult.rating?.votes_count || null,
          latitude: firstResult.latitude || null,
          longitude: firstResult.longitude || null,
          placeId: firstResult.place_id || null,
          cid: firstResult.cid || null,
        }
      : null,
    alternateResults: (maps?.items || []).slice(1, 5).map((item) => ({
      name: item.title,
      address: item.address,
      phone: item.phone,
      category: item.category,
      latitude: item.latitude || null,
      longitude: item.longitude || null,
      placeId: item.place_id || null,
      cid: item.cid || null,
    })),
  };
}

/**
 * Search for address/location data
 */
async function searchAddress(address: string) {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    return { geocode: null, nearbyBusinesses: [] };
  }

  // Check if input is lat/lng
  const latLngMatch = address.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  let geocodeUrl: string;

  if (latLngMatch) {
    // Reverse geocode
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  } else {
    // Forward geocode
    geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  try {
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== "OK" || !geocodeData.results?.[0]) {
      return { geocode: null, nearbyBusinesses: [] };
    }

    const result = geocodeData.results[0];
    const location = result.geometry.location;

    // Extract address components
    const components: Record<string, string> = {};
    for (const comp of result.address_components || []) {
      if (comp.types.includes("locality")) components.city = comp.long_name;
      if (comp.types.includes("administrative_area_level_1")) components.state = comp.short_name;
      if (comp.types.includes("postal_code")) components.zip = comp.long_name;
      if (comp.types.includes("country")) components.country = comp.short_name;
    }

    // Search for nearby businesses
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=500&key=${GOOGLE_MAPS_API_KEY}`;
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();

    const nearbyBusinesses = (nearbyData.results || []).slice(0, 10).map((place: Record<string, unknown>) => ({
      name: place.name,
      placeId: place.place_id,
      category: Array.isArray(place.types) ? place.types[0] : "",
      rating: place.rating || null,
      reviewCount: place.user_ratings_total || null,
      distance: "nearby",
    }));

    return {
      geocode: {
        formattedAddress: result.formatted_address,
        lat: location.lat,
        lng: location.lng,
        placeId: result.place_id,
        components,
      },
      nearbyBusinesses,
    };
  } catch (error) {
    console.error("Address search error:", error);
    return { geocode: null, nearbyBusinesses: [] };
  }
}
