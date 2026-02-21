/**
 * DataForSEO Keywords Data API
 *
 * Endpoints for keyword research: search volume, CPC, competition, suggestions
 */

import { dataforseo } from "./client";

// ============================================
// Types
// ============================================

/**
 * DataForSEO Google Ads Search Volume response structure.
 *
 * IMPORTANT: The API returns keyword metrics (search_volume, cpc, competition, etc.)
 * at the ROOT level of each result object — NOT nested under a `keyword_info` key.
 * This was verified against the live API on 2026-02-21.
 *
 * API docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/
 */
export interface KeywordSearchVolumeResult {
  keyword: string;
  spell: string | null;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  // Keyword metrics are at root level in the API response
  competition: string | null;        // e.g. "LOW", "MEDIUM", "HIGH"
  competition_index: number | null;  // 0-100 numeric competition score
  search_volume: number | null;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  cpc: number | null;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

/**
 * DataForSEO Google Ads keywords_for_keywords response structure.
 *
 * Same as search_volume — metrics are at root level, not under keyword_info.
 * Verified against live API on 2026-02-21.
 */
export interface KeywordSuggestionsResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  // Keyword metrics at root level
  competition: string | null;
  competition_index: number | null;
  search_volume: number | null;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  cpc: number | null;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface SearchIntentResult {
  keyword: string;
  keyword_intent: {
    label: string; // informational | commercial | transactional | navigational
    probability: number;
  };
  secondary_keyword_intents: Array<{
    label: string;
    probability: number;
  }> | null;
}

// ============================================
// API Functions
// ============================================

/**
 * Get search volume and keyword data for one or more keywords
 */
export async function getSearchVolume(
  keywords: string[],
  locationCode: number = 2840, // US
  languageCode: string = "en"
): Promise<KeywordSearchVolumeResult[]> {
  const response = await dataforseo.request<KeywordSearchVolumeResult>(
    "/keywords_data/google_ads/search_volume/live",
    "POST",
    [
      {
        keywords,
        location_code: locationCode,
        language_code: languageCode,
        include_serp_info: true,
        include_search_volume_history: true,
      },
    ]
  );

  return response.tasks?.[0]?.result || [];
}

/**
 * Get keyword suggestions based on a seed keyword
 */
export async function getKeywordSuggestions(
  keyword: string,
  locationCode: number = 2840,
  languageCode: string = "en",
  limit: number = 100
): Promise<KeywordSuggestionsResult[]> {
  const response = await dataforseo.request<KeywordSuggestionsResult>(
    "/keywords_data/google_ads/keywords_for_keywords/live",
    "POST",
    [
      {
        keywords: [keyword],
        location_code: locationCode,
        language_code: languageCode,
        include_serp_info: false,
        limit,
      },
    ]
  );

  return response.tasks?.[0]?.result || [];
}

/**
 * Get keywords that a specific site ranks for
 */
export async function getKeywordsForSite(
  targetDomain: string,
  locationCode: number = 2840,
  languageCode: string = "en",
  limit: number = 100
): Promise<KeywordSuggestionsResult[]> {
  const response = await dataforseo.request<KeywordSuggestionsResult>(
    "/keywords_data/google_ads/keywords_for_site/live",
    "POST",
    [
      {
        target: targetDomain,
        location_code: locationCode,
        language_code: languageCode,
        limit,
      },
    ]
  );

  return response.tasks?.[0]?.result || [];
}

/**
 * Classify search intent for keywords
 */
export async function getSearchIntent(
  keywords: string[]
): Promise<SearchIntentResult[]> {
  const response = await dataforseo.request<SearchIntentResult>(
    "/dataforseo_labs/google/search_intent/live",
    "POST",
    [
      {
        keywords,
      },
    ]
  );

  return response.tasks?.[0]?.result || [];
}
