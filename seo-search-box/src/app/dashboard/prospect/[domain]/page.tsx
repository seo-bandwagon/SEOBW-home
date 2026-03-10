import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { summariseSchema } from "@/lib/schema-extractor";
import {
  Globe,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Phone,
  Mail,
  ChevronRight,
  BarChart3,
  Code2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RankedKeyword {
  keyword?: string;
  keyword_data?: { keyword?: string };
  ranked_serp_element?: {
    serp_item?: {
      rank_absolute?: number;
      rank_group?: number;
    };
  };
  se_results_count?: number;
  search_volume?: number;
  avg_cpc?: number;
  competition?: string | number;
}

interface KeywordIdea {
  keyword?: string;
  keyword_data?: {
    keyword?: string;
    search_volume?: number;
    avg_cpc?: number;
    competition?: string | number;
    keyword_difficulty?: number;
  };
  search_volume?: number;
  avg_cpc?: number;
  competition?: string | number;
}

interface KeywordRow {
  name: string;
  position: number | null;
  volume: number;
  cpc: number | null;
  isForcedBrand?: boolean;
}

interface Competitor {
  domain?: string;
  avg_position?: number;
  sum_position?: number;
  intersections?: number;
  full_domain?: string;
}

interface PagespeedData {
  performance?: number;
  seo?: number;
  best_practices?: number;
  accessibility?: number;
  fcp?: number | string;
  lcp?: number | string;
  tbt?: number | string;
  cls?: number | string;
  speed_index?: number | string;
  mobile_friendly?: boolean;
  https?: boolean;
}

interface ProspectAnalysis {
  id: string;
  domain: string;
  site_url?: string;
  prospect_type?: string;
  intake_method?: string;
  intake_url?: string;
  intake_page_title?: string;
  intake_meta_description?: string;
  intake_at?: string;
  ranked_keywords?: RankedKeyword[];
  competitors?: Competitor[];
  keyword_ideas?: KeywordIdea[];
  pagespeed_data?: PagespeedData;
  schema_data?: Array<{ "@type"?: string | string[]; [key: string]: unknown }>;
  notes?: string;
  analyzed_at?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOCIAL_BLACKLIST = new Set([
  "facebook.com", "youtube.com", "reddit.com", "wikipedia.org",
  "instagram.com", "x.com", "linkedin.com", "twitter.com",
  "tiktok.com", "pinterest.com", "yelp.com",
]);

// Extract core brand name from domain
function extractBrandName(domain: string): string {
  const stripped = domain.replace(/\.(com|net|org|io|co|us|biz|info)$/, "").toLowerCase();
  const suffixes = [
    "products", "product", "services", "service", "company", "companies",
    "corp", "corporation", "inc", "incorporated", "llc", "limited",
    "solutions", "solution", "group", "enterprises", "enterprise",
    "manufacturing", "innovations", "innovation", "technologies", "tech",
    "safety", "systems", "system", "global", "international", "usa", "us",
  ];
  let core = stripped;
  for (const suffix of suffixes) {
    core = core.replace(new RegExp(`${suffix}$`), "");
  }
  return core.replace(/[-_]/g, "");
}

// Check if competitor domain is a brand variant of the target
function isBrandVariant(targetDomain: string, competitorDomain: string): boolean {
  const targetBrand = extractBrandName(targetDomain);
  const competitorBrand = extractBrandName(competitorDomain);
  return targetBrand.length > 3 && competitorBrand.includes(targetBrand);
}

function getKeywordName(kw: RankedKeyword | KeywordIdea): string {
  return (
    (kw as RankedKeyword).keyword ||
    (kw as any).keyword_data?.keyword ||
    ""
  );
}

function getPosition(kw: RankedKeyword): number {
  return (
    kw.ranked_serp_element?.serp_item?.rank_absolute ||
    kw.ranked_serp_element?.serp_item?.rank_group ||
    999
  );
}

function getVolume(kw: RankedKeyword | KeywordIdea): number {
  return (
    (kw as RankedKeyword).search_volume ||
    (kw as any).keyword_data?.search_volume ||
    0
  );
}

function getIdeaCpc(kw: KeywordIdea): number {
  return (
    kw.avg_cpc ||
    (kw as any).keyword_data?.avg_cpc ||
    0
  );
}

function getIdeaCompetition(kw: KeywordIdea): string {
  const c = kw.competition || (kw as any).keyword_data?.competition;
  if (typeof c === "number") {
    if (c < 0.33) return "LOW";
    if (c < 0.66) return "MEDIUM";
    return "HIGH";
  }
  return String(c || "—").toUpperCase();
}

function positionColor(pos: number): string {
  if (pos <= 10) return "text-emerald-400";
  if (pos <= 30) return "text-yellow-400";
  if (pos <= 50) return "text-orange-400";
  return "text-red-400";
}

function positionBg(pos: number): string {
  if (pos <= 10) return "bg-emerald-400/15 text-emerald-400";
  if (pos <= 30) return "bg-yellow-400/15 text-yellow-400";
  if (pos <= 50) return "bg-orange-400/15 text-orange-400";
  return "bg-red-400/15 text-red-400";
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function scoreRing(score: number): string {
  if (score >= 90) return "stroke-emerald-400";
  if (score >= 70) return "stroke-yellow-400";
  if (score >= 50) return "stroke-orange-400";
  return "stroke-red-400";
}

function prospectTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    b2b_industrial: "B2B Industrial",
    artist_musician: "Artist / Musician",
    law_firm: "Law Firm",
    author: "Author",
    nonprofit: "Nonprofit / 501(c)(3)",
    unknown: "Unknown",
  };
  return map[type || "unknown"] || type || "Unknown";
}

function prospectTypeBadgeColor(type?: string): string {
  const map: Record<string, string> = {
    b2b_industrial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    artist_musician: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    law_firm: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    author: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    nonprofit: "bg-green-500/20 text-green-300 border-green-500/30",
    unknown: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };
  return map[type || "unknown"] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function formatMs(val?: number | string): string {
  if (val === undefined || val === null) return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return `${(n / 1000).toFixed(1)}s`;
}

function formatCls(val?: number | string): string {
  if (val === undefined || val === null) return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return n.toFixed(3);
}

// CTR estimate midpoint by position
function estimateCtr(pos: number): number {
  if (pos === 1) return 0.30;
  if (pos === 2) return 0.215;
  if (pos === 3) return 0.15;
  if (pos === 4) return 0.10;
  if (pos === 5) return 0.075;
  if (pos <= 7) return 0.055;
  if (pos <= 10) return 0.04;
  if (pos <= 20) return 0.02;
  return 0;
}

function formatClicks(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

// ─── Score Ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const displayScore = Math.round(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            className={scoreRing(score)}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${scoreColor(score)}`}>{displayScore}</span>
        </div>
      </div>
      <span className="text-[#F5F5F5]/60 text-xs text-center">{label}</span>
    </div>
  );
}

// ─── Volume Bar ───────────────────────────────────────────────────────────────

function VolumeBar({ volume, max }: { volume: number; max: number }) {
  const pct = max > 0 ? Math.min((volume / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#F5F5F5]/10 rounded-full h-1.5 max-w-[120px]">
        <div
          className="h-1.5 rounded-full bg-pink"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[#F5F5F5]/70 text-xs">{volume.toLocaleString()}/mo</span>
    </div>
  );
}

// ─── Competition Badge ────────────────────────────────────────────────────────

function CompBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    LOW: "bg-emerald-400/15 text-emerald-400",
    MEDIUM: "bg-yellow-400/15 text-yellow-400",
    HIGH: "bg-red-400/15 text-red-400",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[level] || "bg-gray-400/15 text-gray-400"}`}>
      {level}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProspectReportPage({
  params,
}: {
  params: { domain: string };
}) {
  const { domain } = params;

  const rows = await db.execute(
    sql`SELECT * FROM prospect_analyses WHERE domain = ${domain} LIMIT 1`
  ) as any[];

  if (!rows || rows.length === 0) {
    notFound();
  }

  const p: ProspectAnalysis = rows[0];

  // ── Data processing ─────────────────────────────────────────────────────

  const ranked: RankedKeyword[] = Array.isArray(p.ranked_keywords) ? p.ranked_keywords : [];
  const ideas: KeywordIdea[] = Array.isArray(p.keyword_ideas) ? p.keyword_ideas : [];
  const allCompetitors: Competitor[] = Array.isArray(p.competitors) ? p.competitors : [];
  const ps: PagespeedData = p.pagespeed_data || {};

  // Build keyword rows from DB data
  const domainBase = domain.replace(/\.(com|net|org|io|co|us)$/, "").replace(/-/g, "").toLowerCase();

  // Strip generic business suffixes to get core brand name (e.g. "redfoxsafetyproducts" → "redfox")
  function getBrandCore(base: string): string {
    const suffixes = [
      "safetyproducts","products","product","safetyservices","services","service",
      "safety","company","corp","manufacturing","innovations","innovation",
      "technologies","tech","enterprises","enterprise","systems","solutions",
      "global","international","usa","inc","llc",
    ];
    let core = base;
    let changed = true;
    while (changed) {
      changed = false;
      for (const s of suffixes) {
        if (core.endsWith(s) && core.length > s.length + 3) {
          core = core.slice(0, -s.length);
          changed = true;
        }
      }
    }
    return core.length > 3 ? core : base;
  }

  const brandCore = getBrandCore(domainBase);

  // Classify branded vs discovery
  function isBrandedKw(kwName: string, isForcedBrand: boolean): boolean {
    if (isForcedBrand) return true;
    const words = kwName.toLowerCase().split(/\s+/);
    // Check 1: any 5+ char word from keyword is substring of domain base
    if (words.some((w) => w.length >= 5 && domainBase.includes(w))) return true;
    // Check 2: keyword with spaces removed contains the brand core (catches "red fox" → "redfox")
    const kwNorm = kwName.toLowerCase().replace(/\s+/g, "");
    if (brandCore.length > 3 && kwNorm.includes(brandCore)) return true;
    return false;
  }

  const allKeywordRows: KeywordRow[] = ranked
    .map((kw) => {
      const name = getKeywordName(kw);
      const pos  = getPosition(kw);
      const volRaw = (kw as any).keyword_data?.keyword_info?.search_volume
        ?? (kw as any).keyword_data?.search_volume
        ?? (kw as any).search_volume;
      const vol: number = typeof volRaw === "number" ? volRaw : 0;
      const rawCpc = (kw as any).keyword_data?.keyword_info?.cpc
        ?? (kw as any).cpc;
      const isForcedBrand: boolean = !!(kw as any)._brand_keyword;
      return {
        name,
        position: pos < 999 ? pos : null,
        volume: vol,
        cpc: typeof rawCpc === "number" ? rawCpc : null,
        isForcedBrand,
      };
    })
    .filter((k) => k.name)
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

  const discoveryKeywords: KeywordRow[] = allKeywordRows
    .filter((k) => k.volume > 0 && !isBrandedKw(k.name, k.isForcedBrand ?? false))
    .map(({ isForcedBrand: _, ...rest }) => rest);

  const brandedKeywords: KeywordRow[] = allKeywordRows
    .filter((k) => isBrandedKw(k.name, k.isForcedBrand ?? false))
    .map((k) => ({ ...k, isForcedBrand: k.isForcedBrand }));

  const isBrandedOnly = ranked.length > 0 && discoveryKeywords.length === 0;

  // Filter ideas to only those with actual search volume
  const filteredIdeas = ideas.filter((idea) => getVolume(idea) > 0);

  // Merge discoveryKeywords + filteredIdeas → deduplicated, sorted by volume desc
  const discoveryNames = new Set(discoveryKeywords.map((k) => k.name.toLowerCase()));
  const ideaRows: KeywordRow[] = filteredIdeas
    .filter((idea) => !discoveryNames.has(getKeywordName(idea).toLowerCase()))
    .map((idea) => ({
      name: getKeywordName(idea),
      position: null,
      volume: getVolume(idea),
      cpc: getIdeaCpc(idea) ?? null,
    }))
    .filter((k) => k.name);

  const opportunityKeywords: KeywordRow[] = [
    ...discoveryKeywords,
    ...ideaRows,
  ].sort((a, b) => b.volume - a.volume);

  // Filter and categorize competitors
  const nonSocialCompetitors = allCompetitors.filter((c) => {
    const d = (c.domain || c.full_domain || "").toLowerCase();
    return d && !SOCIAL_BLACKLIST.has(d);
  });
  
  const brandVariants: Competitor[] = [];
  const realCompetitors: Competitor[] = [];
  
  for (const comp of nonSocialCompetitors) {
    const compDomain = (comp.domain || comp.full_domain || "").toLowerCase();
    if (compDomain === domain.toLowerCase()) continue; // skip self
    if (isBrandVariant(domain, compDomain)) {
      brandVariants.push(comp);
    } else {
      realCompetitors.push(comp);
    }
  }
  
  const cleanCompetitors = realCompetitors.slice(0, 5);

  // Pagespeed avg
  const scores = [ps.performance, ps.seo, ps.best_practices, ps.accessibility]
    .filter((s): s is number => typeof s === "number");
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const isLawFirm = p.prospect_type === "law_firm";
  const schemaBlocks = (p.schema_data ?? []) as Array<{ "@type"?: string | string[]; [key: string]: unknown }>;
  const schemaSummary = summariseSchema(schemaBlocks);
  const isNonprofit = p.prospect_type === "nonprofit" || !!(ps as any).nonprofit_501c3 || schemaSummary.isNonprofit501c3;
  // Grants CTA requires actual detection — schema or HTML scrape confirming 501(c)(3)
  const showGrantsCta = !!(ps as any).nonprofit_501c3 || schemaSummary.isNonprofit501c3;

  // Social links from pagespeed data
  const socialLinks: Record<string, string> = (ps as any).social_links ?? {};
  const SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"] as const;

  // Brand footprint stats
  const totalRanked = ranked.length;
  const bestPosition = allKeywordRows.reduce<number | null>((best, k) => {
    if (k.position === null) return best;
    if (best === null || k.position < best) return k.position;
    return best;
  }, null);
  const totalBrandedVolume = brandedKeywords.reduce((sum, k) => sum + k.volume, 0);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* ── A. Header ─────────────────────────────────────────────────── */}
      <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${prospectTypeBadgeColor(p.prospect_type)}`}>
                {prospectTypeLabel(p.prospect_type)}
              </span>
              <span className="flex items-center gap-1.5 text-[#F5F5F5]/40 text-xs">
                <Zap className="h-3 w-3 text-pink" />
                Captured via Browser Extension
              </span>
            </div>

            <h1 className="font-heading text-5xl text-[#F5F5F5] mb-1">{domain}</h1>

            {p.intake_page_title && (
              <p className="text-[#F5F5F5]/70 text-sm mb-1">{p.intake_page_title}</p>
            )}
            {p.intake_meta_description && (
              <p className="text-[#F5F5F5]/40 text-xs leading-relaxed max-w-xl">{p.intake_meta_description}</p>
            )}

            <div className="flex items-center gap-1.5 mt-3 text-[#F5F5F5]/30 text-xs">
              <Clock className="h-3 w-3" />
              {formatDate(p.intake_at || p.analyzed_at)}
            </div>
          </div>

          {avgScore !== null && (
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={avgScore} label="Overall Health" />
            </div>
          )}
        </div>

        {p.site_url && (
          <div className="mt-4 pt-4 border-t border-pink/10">
            <a
              href={p.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-pink text-xs hover:underline"
            >
              <Globe className="h-3 w-3" />
              {p.site_url}
            </a>
          </div>
        )}
      </div>

      {/* ── B. Brand Footprint ────────────────────────────────────────── */}
      <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-5 w-5 text-pink" />
          <h2 className="font-heading text-3xl text-[#F5F5F5]">Brand Footprint</h2>
        </div>
        <p className="text-[#F5F5F5]/50 text-sm mb-6">
          How {domain} shows up across search and social media.
        </p>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#F5F5F5]">{totalRanked}</p>
            <p className="text-[#F5F5F5]/50 text-xs mt-1">Keywords Ranked</p>
          </div>
          <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#F5F5F5]">
              {bestPosition !== null ? `#${bestPosition}` : "—"}
            </p>
            <p className="text-[#F5F5F5]/50 text-xs mt-1">Best Position</p>
          </div>
          <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#F5F5F5]">
              {totalBrandedVolume > 0 ? totalBrandedVolume.toLocaleString() : "—"}
            </p>
            <p className="text-[#F5F5F5]/50 text-xs mt-1">Branded Vol/Mo</p>
          </div>
        </div>

        {/* Social media presence */}
        <div className="mb-6">
          <p className="text-[#F5F5F5]/40 text-xs uppercase tracking-wider mb-3">Social Media Presence</p>
          <div className="flex flex-wrap gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const url = socialLinks[platform];
              const isPresent = !!url;
              return (
                <div
                  key={platform}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    isPresent
                      ? "bg-emerald-400/5 border-emerald-400/20"
                      : "bg-[#F5F5F5]/3 border-[#F5F5F5]/10"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isPresent ? "bg-emerald-400" : "bg-[#F5F5F5]/20"
                    }`}
                  />
                  {isPresent ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline capitalize"
                    >
                      {platform}
                    </a>
                  ) : (
                    <span className="text-[#F5F5F5]/30 capitalize">{platform}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Branded keywords table */}
        <div>
          <p className="text-[#F5F5F5]/40 text-xs uppercase tracking-wider mb-3">Brand Keywords</p>
          {brandedKeywords.length === 0 ? (
            <p className="text-[#F5F5F5]/30 text-sm italic">No brand keyword data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pink/10">
                    <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">Keyword</th>
                    <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">Rank</th>
                    <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2">Monthly Searches</th>
                  </tr>
                </thead>
                <tbody>
                  {brandedKeywords.map((kw, i) => (
                    <tr key={i} className="border-b border-pink/5 last:border-0">
                      <td className="text-[#F5F5F5] py-2.5 pr-4">{kw.name}</td>
                      <td className="py-2.5 pr-4">
                        {kw.position !== null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positionBg(kw.position)}`}>
                            #{kw.position}
                          </span>
                        ) : (
                          <span className="text-[#F5F5F5]/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {kw.volume > 0 ? (
                          <span className="text-[#F5F5F5]/70">{kw.volume.toLocaleString()}/mo</span>
                        ) : (
                          <span className="text-[#F5F5F5]/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── C. Opportunities ──────────────────────────────────────────── */}
      <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-5 w-5 text-pink" />
          <h2 className="font-heading text-3xl text-[#F5F5F5]">Opportunities</h2>
        </div>
        <p className="text-[#F5F5F5]/50 text-sm mb-6">
          Keywords you could be ranking for — and the traffic they represent.
        </p>

        {/* Traffic Potential summary */}
        {opportunityKeywords.length > 0 && (() => {
          const totalPotential = opportunityKeywords.reduce((sum, kw) => sum + Math.round(kw.volume * 0.30), 0);
          const totalAdValue = opportunityKeywords.reduce((sum, kw) => sum + (kw.cpc && kw.cpc > 0 ? Math.round(kw.volume * 0.30) * kw.cpc : 0), 0);
          return (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-pink/5 border border-pink/20 rounded-xl p-4">
                <p className="text-[#F5F5F5]/40 text-xs font-medium uppercase tracking-widest mb-1">Page 1 Traffic Potential</p>
                <p className="text-pink text-2xl font-bold">~{totalPotential >= 1000 ? `${(totalPotential/1000).toFixed(1)}k` : totalPotential.toLocaleString()}</p>
                <p className="text-[#F5F5F5]/40 text-xs mt-1">visitors/mo if ranking #1 for all opportunities</p>
              </div>
              {totalAdValue > 0 && (
                <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4">
                  <p className="text-[#F5F5F5]/40 text-xs font-medium uppercase tracking-widest mb-1">Equivalent Ad Value</p>
                  <p className="text-[#F5F5F5] text-2xl font-bold">${totalAdValue >= 1000 ? `${(totalAdValue/1000).toFixed(1)}k` : totalAdValue.toFixed(0)}</p>
                  <p className="text-[#F5F5F5]/40 text-xs mt-1">what this traffic would cost in Google Ads/mo</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Branded-only warning */}
        {isBrandedOnly && opportunityKeywords.length === 0 && (
          <div className="flex items-start gap-3 bg-orange-400/10 border border-orange-400/30 rounded-xl p-4 mb-6">
            <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
            <p className="text-orange-300 text-sm">
              <span className="font-semibold">Branded traffic only.</span> This site ranks almost exclusively for brand-name searches — meaning people who already know about you. There&apos;s a significant opportunity to capture new customers who don&apos;t know the brand yet.
            </p>
          </div>
        )}

        {opportunityKeywords.length === 0 ? (
          <p className="text-[#F5F5F5]/30 text-sm italic">No opportunity keywords found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pink/10">
                  <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">Keyword</th>
                  <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">Rank</th>
                  <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">Monthly Volume</th>
                  <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">CPC</th>
                  <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2 pr-4">Est. Current</th>
                  <th className="text-left text-[#F5F5F5]/40 text-xs font-medium pb-2">Pg. 1 Potential</th>
                </tr>
              </thead>
              <tbody>
                {opportunityKeywords.map((kw, i) => {
                  const ctr = kw.position !== null ? estimateCtr(kw.position) : null;
                  const estClicks = ctr !== null && kw.volume > 0
                    ? formatClicks(kw.volume * ctr)
                    : null;
                  const pg1Potential = kw.volume > 0 ? formatClicks(kw.volume * 0.30) : null;
                  return (
                    <tr key={i} className="border-b border-pink/5 last:border-0 hover:bg-[#F5F5F5]/2 transition-colors">
                      <td className="text-[#F5F5F5] py-2.5 pr-4 font-medium">{kw.name}</td>
                      <td className="py-2.5 pr-4">
                        {kw.position !== null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positionBg(kw.position)}`}>
                            #{kw.position}
                          </span>
                        ) : (
                          <span className="text-[#F5F5F5]/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-[#F5F5F5]/70">
                        {kw.volume > 0 ? `${kw.volume.toLocaleString()}/mo` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-[#F5F5F5]/70">
                        {kw.cpc && kw.cpc > 0 ? `$${kw.cpc.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-[#F5F5F5]/50 text-xs">
                        {estClicks !== null ? `~${estClicks}` : "—"}
                      </td>
                      <td className="py-2.5 text-pink font-semibold text-sm">
                        {pg1Potential !== null ? `~${pg1Potential}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── D. Brand Variants (if detected) ────────────────────────────── */}
      {brandVariants.length > 0 && (
        <div className="bg-[#000022] border border-amber-400/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <h2 className="font-heading text-3xl text-[#F5F5F5]">Brand Fragmentation Detected</h2>
          </div>
          <p className="text-[#F5F5F5]/70 text-sm mb-4">
            We found {brandVariants.length} domain{brandVariants.length !== 1 ? "s" : ""} that appear to be part of your brand family. 
            Each one is competing with the others instead of building combined authority.
          </p>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mb-5">
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">The opportunity:</span> Consolidating these domains into one primary site would 
              concentrate your link authority, simplify your SEO strategy, and likely double or triple your organic visibility 
              for product-related searches.
            </p>
          </div>
          <div className="space-y-2">
            {brandVariants.slice(0, 10).map((variant, i) => {
              const variantDomain = variant.domain || variant.full_domain || "unknown";
              const shared = variant.intersections || 0;
              const avgPos = variant.avg_position
                ? Math.round(variant.avg_position)
                : variant.sum_position && shared > 0
                ? Math.round(variant.sum_position / shared)
                : null;

              return (
                <div key={i} className="flex items-center justify-between bg-amber-400/5 border border-amber-400/10 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400/50 text-xs font-mono">#{i + 1}</span>
                    <div>
                      <p className="text-[#F5F5F5] text-sm font-medium">{variantDomain}</p>
                      {shared > 0 && (
                        <p className="text-[#F5F5F5]/40 text-xs">{shared} overlapping keyword{shared !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>
                  {avgPos !== null && (
                    <span className="text-xs font-semibold text-amber-400">
                      Avg #{avgPos}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── E. How You Compare ─────────────────────────────────────────── */}
      {cleanCompetitors.length > 0 && (
        <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-pink" />
            <h2 className="font-heading text-3xl text-[#F5F5F5]">How You Compare</h2>
          </div>
          <p className="text-[#F5F5F5]/50 text-sm mb-6">
            These sites rank for many of the same keywords you should be targeting.
          </p>

          <div className="space-y-3">
            {cleanCompetitors.map((comp, i) => {
              const compDomain = comp.domain || comp.full_domain || "unknown";
              const shared = comp.intersections || 0;
              const avgPos = comp.avg_position
                ? Math.round(comp.avg_position)
                : comp.sum_position && shared > 0
                ? Math.round(comp.sum_position / shared)
                : null;

              return (
                <div key={i} className="flex items-center justify-between bg-[#F5F5F5]/3 border border-pink/10 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[#F5F5F5]/30 text-sm font-mono">#{i + 1}</span>
                    <div>
                      <p className="text-[#F5F5F5] text-sm font-medium">{compDomain}</p>
                      {shared > 0 && (
                        <p className="text-[#F5F5F5]/40 text-xs">{shared} shared keyword{shared !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>
                  {avgPos !== null && (
                    <span className={`text-sm font-semibold ${positionColor(avgPos)}`}>
                      Avg #{avgPos}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── F. Technical Health ─────────────────────────────────────────── */}
      {scores.length > 0 && (
        <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-pink" />
            <h2 className="font-heading text-3xl text-[#F5F5F5]">Technical Health</h2>
          </div>
          <p className="text-[#F5F5F5]/50 text-sm mb-8">
            Measured on mobile. Industry standard: Performance ≥90, load time under 2.5s.
          </p>

          {/* Score rings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            {ps.performance !== undefined && <ScoreRing score={ps.performance} label="Performance" />}
            {ps.seo !== undefined && <ScoreRing score={ps.seo} label="SEO Score" />}
            {ps.best_practices !== undefined && <ScoreRing score={ps.best_practices} label="Best Practices" />}
            {ps.accessibility !== undefined && <ScoreRing score={ps.accessibility} label="Accessibility" />}
          </div>

          {/* Core Web Vitals */}
          {(ps.fcp || ps.lcp || ps.tbt || ps.cls) && (
            <div>
              <p className="text-[#F5F5F5]/40 text-xs uppercase tracking-wider mb-3">Core Web Vitals</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ps.fcp !== undefined && (
                  <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
                    <p className="text-[#F5F5F5]/40 text-xs mb-1">First Contentful Paint</p>
                    <p className="text-[#F5F5F5] font-semibold">{formatMs(ps.fcp)}</p>
                    <p className="text-[#F5F5F5]/30 text-[10px] mt-1">Goal: &lt;1.8s</p>
                  </div>
                )}
                {ps.lcp !== undefined && (
                  <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
                    <p className="text-[#F5F5F5]/40 text-xs mb-1">Largest Contentful Paint</p>
                    <p className="text-[#F5F5F5] font-semibold">{formatMs(ps.lcp)}</p>
                    <p className="text-[#F5F5F5]/30 text-[10px] mt-1">Goal: &lt;2.5s</p>
                  </div>
                )}
                {ps.tbt !== undefined && (
                  <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
                    <p className="text-[#F5F5F5]/40 text-xs mb-1">Total Blocking Time</p>
                    <p className="text-[#F5F5F5] font-semibold">{formatMs(ps.tbt)}</p>
                    <p className="text-[#F5F5F5]/30 text-[10px] mt-1">Goal: &lt;200ms</p>
                  </div>
                )}
                {ps.cls !== undefined && (
                  <div className="bg-[#F5F5F5]/3 border border-pink/10 rounded-xl p-4 text-center">
                    <p className="text-[#F5F5F5]/40 text-xs mb-1">Cumulative Layout Shift</p>
                    <p className="text-[#F5F5F5] font-semibold">{formatCls(ps.cls)}</p>
                    <p className="text-[#F5F5F5]/30 text-[10px] mt-1">Goal: &lt;0.1</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {ps.mobile_friendly !== undefined && (
              <div className="flex items-center gap-1.5 text-xs">
                {ps.mobile_friendly
                  ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  : <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                }
                <span className={ps.mobile_friendly ? "text-emerald-400" : "text-red-400"}>
                  {ps.mobile_friendly ? "Mobile Friendly" : "Not Mobile Friendly"}
                </span>
              </div>
            )}
            {ps.https !== undefined && (
              <div className="flex items-center gap-1.5 text-xs">
                {ps.https
                  ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  : <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                }
                <span className={ps.https ? "text-emerald-400" : "text-red-400"}>
                  {ps.https ? "HTTPS Secure" : "Not HTTPS"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── G. Google Grants (Nonprofits — shown only when 501c3 detected on site) ── */}
      {showGrantsCta && (
        <div className="bg-[#000022] border border-green-500/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <h2 className="font-heading text-3xl text-[#F5F5F5]">You Qualify for Google Ad Grants</h2>
          </div>
          <p className="text-[#F5F5F5]/60 text-sm mb-5">
            As a verified 501(c)(3) organization, {domain} is eligible for the Google Ad Grants program —
            one of the most underutilized resources available to nonprofits.
          </p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 mb-5">
            <p className="text-green-300 text-3xl font-bold mb-1">$10,000 / month</p>
            <p className="text-green-200/80 text-sm">in free Google Search advertising — every month, at no cost to you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {[
              { title: "Reach the right people", body: "Show up when people search for organizations, programs, and services like yours — without paying per click." },
              { title: "No ad spend required", body: "$10,000/month in Google Ads credit, renewed monthly. Eligible nonprofits have used this to drive thousands of new visitors." },
              { title: "Requires a strategy", body: "Google Grants accounts have strict quality requirements. Without proper management, accounts get suspended. We set it up right." },
              { title: "We manage it for you", body: "From application to optimization, we handle the entire Grants account so you can focus on your mission." },
            ].map(({ title, body }) => (
              <div key={title} className="bg-[#F5F5F5]/3 border border-green-500/10 rounded-xl p-4">
                <p className="text-[#F5F5F5] font-semibold text-sm mb-1">{title}</p>
                <p className="text-[#F5F5F5]/50 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#F5F5F5]/3 border border-green-500/20 rounded-xl p-4 mb-5">
            <p className="text-[#F5F5F5]/60 text-xs">
              <span className="text-green-400 font-semibold">How to qualify:</span> Active 501(c)(3) status ✓ ·
              Registered with Google for Nonprofits · Website quality standards · Mission-aligned ad content.
              Most eligible nonprofits are approved within 2–4 weeks.
            </p>
          </div>
          <a
            href="https://www.google.com/grants/how-to-apply/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Apply for Google Ad Grants →
          </a>
        </div>
      )}

      {/* ── G2. Structured Data (Schema) ─────────────────────────────────── */}
      {(() => {
        const blocks = schemaBlocks;
        const summary = schemaSummary;
        const IMPORTANT = [
          { key: "hasLocalBusiness", label: "LocalBusiness", desc: "Tells Google your business name, address, hours, and category. Critical for local SEO." },
          { key: "hasOrganization", label: "Organization", desc: "Establishes your brand identity and social profiles for Knowledge Panel eligibility." },
          { key: "hasPerson", label: "Person", desc: "Links content to a named individual — important for author authority and E-E-A-T." },
          { key: "hasWebSite", label: "WebSite", desc: "Enables Sitelinks Search Box and helps Google understand your site structure." },
          { key: "hasFAQ", label: "FAQPage", desc: "Can generate rich results with expanded Q&A directly in search — high CTR impact." },
          { key: "hasBreadcrumb", label: "BreadcrumbList", desc: "Shows your site hierarchy in search results, improving click-through rate." },
          { key: "hasProduct", label: "Product", desc: "Enables price, availability, and rating stars in product search results." },
          { key: "hasReview", label: "Review / AggregateRating", desc: "Displays star ratings in search results — typically 20-30% CTR lift." },
          { key: "hasArticle", label: "Article / BlogPosting", desc: "Enables article rich results and helps Google understand your content type." },
          { key: "isNonprofit501c3", label: "Nonprofit501c3 (nonprofitStatus)", desc: "Identifies your organization as a 501(c)(3) — required for Google Ad Grants eligibility and nonprofit Knowledge Panel features." },
        ] as const;

        const present = IMPORTANT.filter(i => summary[i.key]);
        const missing = IMPORTANT.filter(i => !summary[i.key]);

        return (
          <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="h-5 w-5 text-pink" />
              <h2 className="font-heading text-3xl text-[#F5F5F5]">Structured Data</h2>
            </div>
            <p className="text-[#F5F5F5]/50 text-sm mb-6">
              Schema markup tells search engines exactly what your content means — enabling rich results, knowledge panels, and better ranking signals.
            </p>

            {blocks.length === 0 ? (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-red-300 text-sm font-semibold">No structured data found</p>
                  <p className="text-[#F5F5F5]/40 text-xs mt-0.5">This site has no JSON-LD schema markup. Competitors with schema get rich results; this site gets plain blue links.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-green-300 text-sm font-semibold">{blocks.length} schema block{blocks.length !== 1 ? "s" : ""} found: {summary.types.join(", ")}</p>
                  <p className="text-[#F5F5F5]/40 text-xs mt-0.5">Schema is implemented. Review what&apos;s present and what&apos;s missing below.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {present.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-400/70 uppercase tracking-widest mb-2">✓ Present</p>
                  <div className="grid gap-2">
                    {present.map(item => (
                      <div key={item.key} className="flex items-start gap-3 bg-green-500/5 border border-green-500/15 rounded-lg px-4 py-3">
                        <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[#F5F5F5]/80 text-sm font-semibold">{item.label}</span>
                          <p className="text-[#F5F5F5]/40 text-xs mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {missing.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-red-400/70 uppercase tracking-widest mb-2">✗ Missing</p>
                  <div className="grid gap-2">
                    {missing.map(item => (
                      <div key={item.key} className="flex items-start gap-3 bg-[#F5F5F5]/2 border border-pink/8 rounded-lg px-4 py-3">
                        <AlertCircle className="h-3.5 w-3.5 text-[#F5F5F5]/20 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[#F5F5F5]/50 text-sm font-semibold">{item.label}</span>
                          <p className="text-[#F5F5F5]/30 text-xs mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>



          </div>
        );
      })()}

      {/* ── H. The Opportunity (CTA) ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-pink/30 bg-gradient-to-br from-pink/20 via-[#000022] to-[#000022] p-10 text-center">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-pink/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <h2 className="font-heading text-5xl text-[#F5F5F5] mb-4">
            There&apos;s more here than most people realize.
          </h2>
          <p className="text-[#F5F5F5]/70 text-base max-w-xl mx-auto mb-2">
            {isLawFirm
              ? `The keywords your competitors rank for represent tens of thousands in monthly ad spend — traffic you could own organically. A focused 90-day SEO strategy could fundamentally change how clients find you.`
              : filteredIdeas.length > 0
              ? `The opportunity we've identified here is just the surface. A full keyword landscape analysis, content strategy, and technical roadmap would reveal exactly how to outrank your competitors and capture search traffic you're currently leaving on the table.`
              : `Your current organic footprint only scratches the surface of what's possible. A focused SEO strategy built around your actual customers' search behavior could dramatically change your visibility.`
            }
          </p>
          <p className="text-[#F5F5F5]/50 text-sm max-w-lg mx-auto mb-8">
            We don&apos;t do generic audits. We build strategies that move the needle — and we&apos;d love to show you exactly what that looks like for {domain}.
          </p>

          <a
            href="https://calendar.app.google/JWAE1wfCYGGjGTin9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-pink hover:bg-pink/90 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base mb-6"
          >
            <Phone className="h-4 w-4" />
            Schedule a Free Strategy Call
          </a>

          <div className="flex items-center justify-center gap-6 text-[#F5F5F5]/40 text-sm">
            <a href="tel:+18665354736" className="flex items-center gap-1.5 hover:text-pink transition-colors">
              <Phone className="h-3.5 w-3.5" />
              (866) 535-4SEO
            </a>
            <span className="text-[#F5F5F5]/20">|</span>
            <a href="mailto:info@seobandwagon.com" className="flex items-center gap-1.5 hover:text-pink transition-colors">
              <Mail className="h-3.5 w-3.5" />
              info@seobandwagon.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
