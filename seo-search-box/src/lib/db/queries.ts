import { db } from "./client";
import {
  searches,
  keywordData,
  relatedKeywords,
  domainData,
  rankedKeywords,
  pageData,
  businessData,
  serpHistory,
  domainRankHistory,
  savedSearches,
  alerts,
  trackedKeywords,
} from "./schema";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";

// ============================================
// Types
// ============================================

export type InputType = "keyword" | "url" | "phone" | "business" | "address";

export interface SaveSearchParams {
  userId?: string;
  inputType: InputType;
  inputValue: string;
  normalizedValue?: string;
}

export interface KeywordDataParams {
  searchId: string;
  keyword: string;
  searchVolume?: number | null;
  cpcLow?: number | null;
  cpcHigh?: number | null;
  cpcAvg?: number | null;
  competition?: number | null;
  difficulty?: number | null;
  searchIntent?: string | null;
  trendData?: unknown;
  serpFeatures?: unknown;
}

export interface RelatedKeywordParams {
  keywordDataId: string;
  keyword: string;
  searchVolume?: number | null;
  cpc?: number | null;
  relevanceScore?: number | null;
  keywordType?: string;
}

export interface DomainDataParams {
  searchId: string;
  domain: string;
  domainRank?: number | null;
  backlinkCount?: number | null;
  referringDomains?: number | null;
  organicTraffic?: number | null;
  organicKeywordsCount?: number | null;
  competitorDomains?: unknown;
  whoisData?: unknown;
}

export interface RankedKeywordParams {
  domainDataId: string;
  keyword: string;
  position?: number | null;
  searchVolume?: number | null;
  url?: string | null;
  previousPosition?: number | null;
}

export interface PageDataParams {
  searchId: string;
  url: string;
  title?: string | null;
  metaDescription?: string | null;
  h1Tags?: unknown;
  wordCount?: number | null;
  wordFrequency?: unknown;
  internalLinks?: number | null;
  externalLinks?: number | null;
  images?: number | null;
  schemaTypes?: unknown;
  lighthousePerformance?: number | null;
  lighthouseAccessibility?: number | null;
  lighthouseSeo?: number | null;
  lighthouseBestPractices?: number | null;
  coreWebVitals?: unknown;
}

export interface BusinessDataParams {
  searchId: string;
  businessName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  phone?: string | null;
  website?: string | null;
  category?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  recentReviews?: unknown;
  reviewSentiment?: unknown;
  linkedinUrl?: string | null;
  socialProfiles?: unknown;
}

// ============================================
// Search Operations
// ============================================

/**
 * Save a new search record
 */
export async function saveSearch(params: SaveSearchParams) {
  const [newSearch] = await db
    .insert(searches)
    .values({
      userId: params.userId,
      inputType: params.inputType,
      inputValue: params.inputValue,
      normalizedValue: params.normalizedValue,
    })
    .returning();

  return newSearch;
}

/**
 * Get searches for a user
 */
export async function getUserSearches(userId: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(searches)
    .where(eq(searches.userId, userId))
    .orderBy(desc(searches.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single search with all related data
 */
export async function getSearchWithData(searchId: string) {
  const search = await db.query.searches.findFirst({
    where: eq(searches.id, searchId),
    with: {
      keywordData: {
        with: {
          relatedKeywords: true,
        },
      },
      domainData: {
        with: {
          rankedKeywords: true,
        },
      },
      pageData: true,
      businessData: true,
    },
  });

  return search;
}

/**
 * Get recent searches (for homepage, etc.)
 */
export async function getRecentSearches(limit = 10) {
  return db
    .select({
      id: searches.id,
      inputType: searches.inputType,
      inputValue: searches.inputValue,
      createdAt: searches.createdAt,
    })
    .from(searches)
    .orderBy(desc(searches.createdAt))
    .limit(limit);
}

/**
 * Delete a search and all related data (cascade)
 */
export async function deleteSearch(searchId: string, userId: string) {
  return db
    .delete(searches)
    .where(and(eq(searches.id, searchId), eq(searches.userId, userId)))
    .returning();
}

// ============================================
// Keyword Data Operations
// ============================================

/**
 * Save keyword data for a search
 */
export async function saveKeywordData(params: KeywordDataParams) {
  const [data] = await db
    .insert(keywordData)
    .values({
      searchId: params.searchId,
      keyword: params.keyword,
      searchVolume: params.searchVolume,
      cpcLow: params.cpcLow?.toString(),
      cpcHigh: params.cpcHigh?.toString(),
      cpcAvg: params.cpcAvg?.toString(),
      competition: params.competition?.toString(),
      difficulty: params.difficulty,
      searchIntent: params.searchIntent,
      trendData: params.trendData,
      serpFeatures: params.serpFeatures,
    })
    .returning();

  return data;
}

/**
 * Save multiple related keywords
 */
export async function saveRelatedKeywords(keywords: RelatedKeywordParams[]) {
  if (keywords.length === 0) return [];

  return db
    .insert(relatedKeywords)
    .values(
      keywords.map((kw) => ({
        keywordDataId: kw.keywordDataId,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        cpc: kw.cpc?.toString(),
        relevanceScore: kw.relevanceScore?.toString(),
        keywordType: kw.keywordType,
      }))
    )
    .returning();
}

/**
 * Get keyword history for trending
 */
export async function getKeywordHistory(keyword: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select({
      searchVolume: keywordData.searchVolume,
      cpcAvg: keywordData.cpcAvg,
      competition: keywordData.competition,
      createdAt: keywordData.createdAt,
    })
    .from(keywordData)
    .where(
      and(
        eq(keywordData.keyword, keyword),
        gte(keywordData.createdAt, startDate)
      )
    )
    .orderBy(keywordData.createdAt);
}

// ============================================
// Domain Data Operations
// ============================================

/**
 * Save domain data for a search
 */
export async function saveDomainData(params: DomainDataParams) {
  const [data] = await db
    .insert(domainData)
    .values({
      searchId: params.searchId,
      domain: params.domain,
      domainRank: params.domainRank,
      backlinkCount: params.backlinkCount,
      referringDomains: params.referringDomains,
      organicTraffic: params.organicTraffic,
      organicKeywordsCount: params.organicKeywordsCount,
      competitorDomains: params.competitorDomains,
      whoisData: params.whoisData,
    })
    .returning();

  return data;
}

/**
 * Save ranked keywords for a domain
 */
export async function saveRankedKeywords(keywords: RankedKeywordParams[]) {
  if (keywords.length === 0) return [];

  return db
    .insert(rankedKeywords)
    .values(
      keywords.map((kw) => ({
        domainDataId: kw.domainDataId,
        keyword: kw.keyword,
        position: kw.position,
        searchVolume: kw.searchVolume,
        url: kw.url,
        previousPosition: kw.previousPosition,
      }))
    )
    .returning();
}

/**
 * Get domain history for trending
 */
export async function getDomainHistory(domain: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select({
      domainRank: domainData.domainRank,
      backlinkCount: domainData.backlinkCount,
      referringDomains: domainData.referringDomains,
      organicTraffic: domainData.organicTraffic,
      createdAt: domainData.createdAt,
    })
    .from(domainData)
    .where(
      and(eq(domainData.domain, domain), gte(domainData.createdAt, startDate))
    )
    .orderBy(domainData.createdAt);
}

// ============================================
// Page Data Operations
// ============================================

/**
 * Save page data for a search
 */
export async function savePageData(params: PageDataParams) {
  const [data] = await db
    .insert(pageData)
    .values({
      searchId: params.searchId,
      url: params.url,
      title: params.title,
      metaDescription: params.metaDescription,
      h1Tags: params.h1Tags,
      wordCount: params.wordCount,
      wordFrequency: params.wordFrequency,
      internalLinks: params.internalLinks,
      externalLinks: params.externalLinks,
      images: params.images,
      schemaTypes: params.schemaTypes,
      lighthousePerformance: params.lighthousePerformance,
      lighthouseAccessibility: params.lighthouseAccessibility,
      lighthouseSeo: params.lighthouseSeo,
      lighthouseBestPractices: params.lighthouseBestPractices,
      coreWebVitals: params.coreWebVitals,
    })
    .returning();

  return data;
}

// ============================================
// Business Data Operations
// ============================================

/**
 * Save business data for a search
 */
export async function saveBusinessData(params: BusinessDataParams) {
  const [data] = await db
    .insert(businessData)
    .values({
      searchId: params.searchId,
      businessName: params.businessName,
      address: params.address,
      city: params.city,
      state: params.state,
      zip: params.zip,
      country: params.country,
      phone: params.phone,
      website: params.website,
      category: params.category,
      googleRating: params.googleRating?.toString(),
      googleReviewCount: params.googleReviewCount,
      recentReviews: params.recentReviews,
      reviewSentiment: params.reviewSentiment,
      linkedinUrl: params.linkedinUrl,
      socialProfiles: params.socialProfiles,
    })
    .returning();

  return data;
}

// ============================================
// Historical Tracking Operations
// ============================================

/**
 * Record SERP position for keyword/domain combo
 */
export async function recordSerpPosition(
  keyword: string,
  domain: string,
  position: number | null,
  url?: string
) {
  const [record] = await db
    .insert(serpHistory)
    .values({
      keyword,
      domain,
      position,
      url,
    })
    .returning();

  return record;
}

/**
 * Get SERP history for keyword/domain
 */
export async function getSerpHistory(
  keyword: string,
  domain: string,
  days = 90
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select()
    .from(serpHistory)
    .where(
      and(
        eq(serpHistory.keyword, keyword),
        eq(serpHistory.domain, domain),
        gte(serpHistory.recordedAt, startDate)
      )
    )
    .orderBy(serpHistory.recordedAt);
}

/**
 * Record domain rank history
 */
export async function recordDomainRank(
  domain: string,
  domainRank: number | null,
  organicTraffic: number | null
) {
  const [record] = await db
    .insert(domainRankHistory)
    .values({
      domain,
      domainRank,
      organicTraffic,
    })
    .returning();

  return record;
}

/**
 * Get domain rank history
 */
export async function getDomainRankHistory(domain: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select()
    .from(domainRankHistory)
    .where(
      and(
        eq(domainRankHistory.domain, domain),
        gte(domainRankHistory.recordedAt, startDate)
      )
    )
    .orderBy(domainRankHistory.recordedAt);
}

// ============================================
// Tracked Keywords Operations
// ============================================

/**
 * Add a keyword+domain pair to tracking
 */
export async function addTrackedKeyword(
  keyword: string,
  domain: string,
  position?: number | null,
  userId?: string
) {
  // Check if already tracked
  const existing = await db
    .select()
    .from(trackedKeywords)
    .where(
      and(
        eq(trackedKeywords.keyword, keyword),
        eq(trackedKeywords.domain, domain)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update last position
    const [updated] = await db
      .update(trackedKeywords)
      .set({
        lastPosition: position,
        lastCheckedAt: new Date(),
      })
      .where(eq(trackedKeywords.id, existing[0].id))
      .returning();
    return updated;
  }

  const [tracked] = await db
    .insert(trackedKeywords)
    .values({
      keyword,
      domain,
      userId,
      lastPosition: position,
      lastCheckedAt: position !== undefined ? new Date() : undefined,
    })
    .returning();

  return tracked;
}

/**
 * Get all tracked keywords
 */
export async function getTrackedKeywords(userId?: string) {
  if (userId) {
    return db
      .select()
      .from(trackedKeywords)
      .where(eq(trackedKeywords.userId, userId))
      .orderBy(desc(trackedKeywords.lastCheckedAt));
  }
  // Return all if no user (public mode)
  return db
    .select()
    .from(trackedKeywords)
    .orderBy(desc(trackedKeywords.lastCheckedAt));
}

/**
 * Remove a tracked keyword
 */
export async function removeTrackedKeyword(id: string) {
  return db
    .delete(trackedKeywords)
    .where(eq(trackedKeywords.id, id))
    .returning();
}

/**
 * Update tracked keyword position
 */
export async function updateTrackedKeywordPosition(
  id: string,
  position: number | null
) {
  return db
    .update(trackedKeywords)
    .set({
      lastPosition: position,
      lastCheckedAt: new Date(),
    })
    .where(eq(trackedKeywords.id, id))
    .returning();
}

// ============================================
// Saved Searches Operations
// ============================================

/**
 * Save a search for a user
 */
export async function saveSearchForUser(
  userId: string,
  searchId: string,
  name?: string
) {
  const [saved] = await db
    .insert(savedSearches)
    .values({
      userId,
      searchId,
      name,
    })
    .returning();

  return saved;
}

/**
 * Get user's saved searches
 */
export async function getUserSavedSearches(userId: string, limit = 50) {
  return db
    .select({
      id: savedSearches.id,
      name: savedSearches.name,
      createdAt: savedSearches.createdAt,
      search: {
        id: searches.id,
        inputType: searches.inputType,
        inputValue: searches.inputValue,
        normalizedValue: searches.normalizedValue,
        createdAt: searches.createdAt,
      },
    })
    .from(savedSearches)
    .innerJoin(searches, eq(savedSearches.searchId, searches.id))
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt))
    .limit(limit);
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(savedSearchId: string, userId: string) {
  return db
    .delete(savedSearches)
    .where(
      and(eq(savedSearches.id, savedSearchId), eq(savedSearches.userId, userId))
    )
    .returning();
}

// ============================================
// Alerts Operations
// ============================================

export type AlertType = "rank_change" | "traffic_change" | "new_backlink";

/**
 * Create an alert for a search
 */
export async function createAlert(
  userId: string,
  searchId: string,
  alertType: AlertType,
  threshold?: number
) {
  const [alert] = await db
    .insert(alerts)
    .values({
      userId,
      searchId,
      alertType,
      threshold,
    })
    .returning();

  return alert;
}

/**
 * Get user's alerts
 */
export async function getUserAlerts(userId: string) {
  return db
    .select({
      id: alerts.id,
      alertType: alerts.alertType,
      threshold: alerts.threshold,
      isActive: alerts.isActive,
      lastTriggered: alerts.lastTriggered,
      createdAt: alerts.createdAt,
      search: {
        id: searches.id,
        inputType: searches.inputType,
        inputValue: searches.inputValue,
      },
    })
    .from(alerts)
    .innerJoin(searches, eq(alerts.searchId, searches.id))
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt));
}

/**
 * Get active alerts for processing
 */
export async function getActiveAlerts() {
  return db
    .select()
    .from(alerts)
    .innerJoin(searches, eq(alerts.searchId, searches.id))
    .where(eq(alerts.isActive, true));
}

/**
 * Update alert status
 */
export async function updateAlert(
  alertId: string,
  userId: string,
  updates: { isActive?: boolean; lastTriggered?: Date }
) {
  return db
    .update(alerts)
    .set(updates)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .returning();
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string, userId: string) {
  return db
    .delete(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .returning();
}

// ============================================
// Aggregate & Analytics Queries
// ============================================

/**
 * Get search statistics for a user
 */
export async function getUserSearchStats(userId: string) {
  const stats = await db
    .select({
      inputType: searches.inputType,
      count: sql<number>`count(*)::int`,
    })
    .from(searches)
    .where(eq(searches.userId, userId))
    .groupBy(searches.inputType);

  return stats;
}

/**
 * Get top searched keywords
 */
export async function getTopKeywords(userId: string, limit = 10) {
  return db
    .select({
      keyword: keywordData.keyword,
      searchCount: sql<number>`count(*)::int`,
      avgSearchVolume: sql<number>`avg(${keywordData.searchVolume})::int`,
    })
    .from(keywordData)
    .innerJoin(searches, eq(keywordData.searchId, searches.id))
    .where(eq(searches.userId, userId))
    .groupBy(keywordData.keyword)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

/**
 * Get top searched domains
 */
export async function getTopDomains(userId: string, limit = 10) {
  return db
    .select({
      domain: domainData.domain,
      searchCount: sql<number>`count(*)::int`,
      latestRank: sql<number>`(array_agg(${domainData.domainRank} ORDER BY ${domainData.createdAt} DESC))[1]`,
    })
    .from(domainData)
    .innerJoin(searches, eq(domainData.searchId, searches.id))
    .where(eq(searches.userId, userId))
    .groupBy(domainData.domain)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

/**
 * Full-text search across searches
 */
export async function searchUserHistory(
  userId: string,
  query: string,
  limit = 20
) {
  return db
    .select()
    .from(searches)
    .where(
      and(
        eq(searches.userId, userId),
        sql`${searches.inputValue} ILIKE ${`%${query}%`}`
      )
    )
    .orderBy(desc(searches.createdAt))
    .limit(limit);
}

// ============================================
// Batch Operations
// ============================================

/**
 * Save complete keyword search results
 */
export async function saveKeywordSearchResults(
  searchId: string,
  results: {
    keyword: KeywordDataParams;
    relatedKeywords: Omit<RelatedKeywordParams, "keywordDataId">[];
  }
) {
  const savedKeyword = await saveKeywordData({
    ...results.keyword,
    searchId,
  });

  if (results.relatedKeywords.length > 0) {
    await saveRelatedKeywords(
      results.relatedKeywords.map((kw) => ({
        ...kw,
        keywordDataId: savedKeyword.id,
      }))
    );
  }

  return savedKeyword;
}

/**
 * Save complete domain search results
 */
export async function saveDomainSearchResults(
  searchId: string,
  results: {
    domain: DomainDataParams;
    rankedKeywords: Omit<RankedKeywordParams, "domainDataId">[];
    pageAnalysis?: PageDataParams;
  }
) {
  const savedDomain = await saveDomainData({
    ...results.domain,
    searchId,
  });

  if (results.rankedKeywords.length > 0) {
    await saveRankedKeywords(
      results.rankedKeywords.map((kw) => ({
        ...kw,
        domainDataId: savedDomain.id,
      }))
    );
  }

  if (results.pageAnalysis) {
    await savePageData({
      ...results.pageAnalysis,
      searchId,
    });
  }

  // Record historical data
  if (results.domain.domainRank || results.domain.organicTraffic) {
    await recordDomainRank(
      results.domain.domain,
      results.domain.domainRank ?? null,
      results.domain.organicTraffic ?? null
    );
  }

  return savedDomain;
}

/**
 * Save complete business search results
 */
export async function saveBusinessSearchResults(
  searchId: string,
  results: BusinessDataParams
) {
  return saveBusinessData({
    ...results,
    searchId,
  });
}
