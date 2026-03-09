/**
 * Fetches a URL and extracts all JSON-LD structured data blocks.
 * Returns an array of parsed schema objects.
 */
export interface SchemaBlock {
  "@type"?: string | string[];
  [key: string]: unknown;
}

export async function extractSchema(siteUrl: string): Promise<SchemaBlock[]> {
  try {
    const url = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const html = await res.text();

    // Extract all <script type="application/ld+json"> blocks
    const blocks: SchemaBlock[] = [];
    const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        // Handle @graph arrays
        if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
          blocks.push(...parsed["@graph"]);
        } else if (Array.isArray(parsed)) {
          blocks.push(...parsed);
        } else {
          blocks.push(parsed);
        }
      } catch {
        // Skip malformed JSON-LD
      }
    }

    return blocks;
  } catch {
    return [];
  }
}

/**
 * Get a human-readable label for a schema @type
 */
export function schemaTypeLabel(type: string | string[] | undefined): string {
  if (!type) return "Unknown";
  const t = Array.isArray(type) ? type[0] : type;
  // Strip any namespace prefix
  return t.replace(/^.*[/#]/, "");
}

/**
 * Summarise what schema types are present and how many blocks
 */
export function summariseSchema(blocks: SchemaBlock[]): {
  types: string[];
  count: number;
  hasLocalBusiness: boolean;
  hasPerson: boolean;
  hasOrganization: boolean;
  hasWebSite: boolean;
  hasBreadcrumb: boolean;
  hasFAQ: boolean;
  hasProduct: boolean;
  hasReview: boolean;
  hasArticle: boolean;
} {
  const rawTypes: string[] = blocks.map(b => schemaTypeLabel(b["@type"] as string | string[])).filter((x): x is string => x.length > 0);
  const types: string[] = Array.from(new Set(rawTypes));
  const has = (t: string) => types.some(x => x.toLowerCase().includes(t.toLowerCase()));
  return {
    types,
    count: blocks.length,
    hasLocalBusiness: has("LocalBusiness") || has("LegalService") || has("Attorney"),
    hasPerson: has("Person"),
    hasOrganization: has("Organization"),
    hasWebSite: has("WebSite"),
    hasBreadcrumb: has("BreadcrumbList"),
    hasFAQ: has("FAQPage") || has("FAQ"),
    hasProduct: has("Product"),
    hasReview: has("Review") || has("AggregateRating"),
    hasArticle: has("Article") || has("BlogPosting") || has("NewsArticle"),
  };
}
