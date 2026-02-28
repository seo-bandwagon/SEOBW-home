/**
 * DataForSEO API Client
 * Used for local rank tracking via Google Maps SERP API
 */

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.warn("DataForSEO credentials not configured");
}

const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64");

interface MapsSearchResult {
  type: string;
  rank_group: number;
  rank_absolute: number;
  title: string;
  place_id: string;
  rating?: {
    value: number;
    votes_count: number;
  };
  address?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  category?: string;
}

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  tasks: Array<{
    status_code: number;
    status_message: string;
    result: Array<{
      items: MapsSearchResult[];
    }>;
  }>;
}

/**
 * Query Google Maps SERP for a single coordinate point
 */
export async function queryMapsPoint(
  keyword: string,
  lat: number,
  lng: number,
  depth: number = 20
): Promise<MapsSearchResult[]> {
  const response = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword,
        location_coordinate: `${lat.toFixed(6)},${lng.toFixed(6)},15`,
        language_code: "en",
        device: "desktop",
        os: "windows",
        depth,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
  }

  const data: DataForSEOResponse = await response.json();

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${data.status_message}`);
  }

  const task = data.tasks?.[0];
  if (task?.status_code !== 20000) {
    // "No Search Results" is a valid response for some locations
    if (task?.status_message === "No Search Results.") {
      return [];
    }
    throw new Error(`Task error: ${task?.status_message}`);
  }

  return task.result?.[0]?.items || [];
}

/**
 * Search for a business by name and location
 */
/**
 * US state abbreviation → full name mapping for location normalization.
 */
const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

/**
 * Normalize a user-friendly location string (e.g. "Seattle, WA") to
 * DataForSEO's expected format: "City,State,United States"
 */
function normalizeLocation(input: string): string {
  // Already in DataForSEO format (contains "United States")
  if (input.includes("United States")) return input;

  // Try to match "City, ST" or "City, State" patterns
  const match = input.match(/^(.+?)[,\s]+([A-Z]{2})$/i);
  if (match) {
    const city = match[1].trim();
    const stateAbbr = match[2].toUpperCase();
    const stateName = US_STATES[stateAbbr];
    if (stateName) {
      return `${city},${stateName},United States`;
    }
  }

  // Try zip code pattern — just append United States
  if (/^\d{5}(-\d{4})?$/.test(input.trim())) {
    return input.trim();
  }

  // Fallback: append United States if not already present
  return `${input},United States`;
}

export async function findBusiness(
  keyword: string,
  businessName: string,
  location: string
): Promise<MapsSearchResult | null> {
  // Normalize user-friendly location to DataForSEO format
  const resolvedLocation = normalizeLocation(location);

  const response = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword: `${keyword} ${businessName}`,
        location_name: resolvedLocation,
        language_code: "en",
        device: "desktop",
        os: "windows",
        depth: 20,
      },
    ]),
  });

  const data: DataForSEOResponse = await response.json();
  const items = data.tasks?.[0]?.result?.[0]?.items || [];

  const normalizedSearch = businessName.toLowerCase().trim();
  const match = items.find(
    (item) =>
      item.type === "maps_search" && item.title?.toLowerCase().includes(normalizedSearch)
  );

  return match || null;
}

/**
 * Generate a grid of lat/lng points around a center point
 */
export function generateGrid(
  centerLat: number,
  centerLng: number,
  gridSize: number = 5,
  radiusMiles: number = 5
): Array<{ lat: number; lng: number; row: number; col: number }> {
  const points: Array<{ lat: number; lng: number; row: number; col: number }> = [];

  // Convert miles to degrees
  const latDegPerMile = 1 / 69;
  const lngDegPerMile = 1 / (69 * Math.cos((centerLat * Math.PI) / 180));

  const latRange = radiusMiles * latDegPerMile * 2;
  const lngRange = radiusMiles * lngDegPerMile * 2;

  const latStep = latRange / (gridSize - 1);
  const lngStep = lngRange / (gridSize - 1);

  const startLat = centerLat + latRange / 2;
  const startLng = centerLng - lngRange / 2;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      points.push({
        lat: startLat - row * latStep,
        lng: startLng + col * lngStep,
        row,
        col,
      });
    }
  }

  return points;
}

/**
 * Find a business's rank in the results
 */
export function findBusinessRank(
  results: MapsSearchResult[],
  businessName?: string,
  placeId?: string
): { rank: number | null; item: MapsSearchResult | null } {
  const normalizedSearch = businessName?.toLowerCase().trim();

  // Filter out paid items
  const organicResults = results.filter((item) => item.type !== "maps_paid_item");

  for (let i = 0; i < organicResults.length; i++) {
    const item = organicResults[i];

    // Match by place_id if provided
    if (placeId && item.place_id === placeId) {
      return { rank: i + 1, item };
    }

    // Match by name (fuzzy)
    if (normalizedSearch && item.title?.toLowerCase().includes(normalizedSearch)) {
      return { rank: i + 1, item };
    }
  }

  return { rank: null, item: null };
}

export interface GridScanResult {
  lat: number;
  lng: number;
  row: number;
  col: number;
  rank: number | null;
  topResult: string | null;
  businessFound: string | null;
}

export interface GridScanSummary {
  gridSize: number;
  radiusMiles: number;
  centerLat: number;
  centerLng: number;
  keyword: string;
  business: string;
  placeId?: string;
  results: GridScanResult[];
  stats: {
    averageRank: number | null;
    visibilityPercent: number;
    top3Count: number;
    top10Count: number;
    totalPoints: number;
    rankedPoints: number;
  };
  cost: number;
}

/**
 * Run a full grid scan for a business
 */
export async function runGridScan(
  keyword: string,
  centerLat: number,
  centerLng: number,
  businessName?: string,
  placeId?: string,
  options: { gridSize?: number; radiusMiles?: number; delayMs?: number } = {}
): Promise<GridScanSummary> {
  const { gridSize = 5, radiusMiles = 5, delayMs = 100 } = options;

  const grid = generateGrid(centerLat, centerLng, gridSize, radiusMiles);
  const results: GridScanResult[] = new Array(grid.length);

  // Run grid point requests with bounded concurrency to avoid long sequential runtimes.
  const MAX_CONCURRENCY = 3;
  const concurrency = Math.min(MAX_CONCURRENCY, grid.length || 1);
  let currentIndex = 0;

  const workers: Promise<void>[] = [];

  const runWorker = async () => {
    // Each worker processes multiple grid points in sequence.
    // This preserves the existing rate-limiting delay while allowing
    // several points to be processed in parallel.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const index = currentIndex++;
      if (index >= grid.length) {
        return;
      }

      const point = grid[index];
      try {
        const mapResults = await queryMapsPoint(keyword, point.lat, point.lng);
        const { rank, item } = findBusinessRank(mapResults, businessName, placeId);

        const topOrganic = mapResults.find((r) => r.type !== "maps_paid_item");

        results[index] = {
          ...point,
          rank,
          topResult: topOrganic?.title || null,
          businessFound: item?.title || null,
        };

        // Rate limiting
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      } catch (err) {
        console.error(`Error at point (${point.row},${point.col}):`, err);
        results[index] = {
          ...point,
          rank: null,
          topResult: null,
          businessFound: null,
        };
      }
    }
  };

  for (let i = 0; i < concurrency; i++) {
    workers.push(runWorker());
  }

  await Promise.all(workers);
  // Calculate stats
  const ranks = results.map((r) => r.rank).filter((r): r is number => r !== null);
  const averageRank =
    ranks.length > 0 ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10 : null;
  const visibilityPercent = Math.round((ranks.length / results.length) * 100);
  const top3Count = ranks.filter((r) => r <= 3).length;
  const top10Count = ranks.filter((r) => r <= 10).length;

  return {
    gridSize,
    radiusMiles,
    centerLat,
    centerLng,
    keyword,
    business: businessName || placeId || "Unknown",
    placeId,
    results,
    stats: {
      averageRank,
      visibilityPercent,
      top3Count,
      top10Count,
      totalPoints: results.length,
      rankedPoints: ranks.length,
    },
    cost: results.length * 0.002, // Live mode pricing
  };
}
