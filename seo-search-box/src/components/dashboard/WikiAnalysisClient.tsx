"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Clock,
  Link2,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  BarChart3,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { BarChart } from "@/components/charts";

interface WikiPage {
  slug: string;
  url: string;
  title: string;
  serp_keywords: Array<{
    keyword: string;
    position: number;
    volume?: number;
    etv?: number;
  }>;
  keyword_count: number;
  est_traffic: number;
  external_links: Array<{ url: string; domain: string }>;
  external_link_count: number;
  internal_link_count: number;
  wayback_monthly_captures: number;
  wayback_first_capture: string | null;
  wayback_last_capture: string | null;
  wayback_first_url: string | null;
  wayback_latest_url: string | null;
  wayback_captures_by_year: Record<string, number>;
}

interface Stats {
  total_pages: number;
  total_captures: number;
  total_external_links: number;
  total_keywords: number;
  oldest_capture: string | null;
  avg_captures: number;
}

interface TopDomain {
  domain: string;
  count: number;
}

type SortField = "captures" | "first" | "links" | "keywords" | "title";
type SortDir = "asc" | "desc";

export function WikiAnalysisClient() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topDomains, setTopDomains] = useState<TopDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("captures");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/wiki-analysis")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPages(data.pages || []);
        setStats(data.stats || null);
        setTopDomains(data.topDomains || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedPages = [...pages]
    .filter(
      (p) =>
        !searchFilter ||
        p.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.title || "").toLowerCase().includes(searchFilter.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "captures":
          return (a.wayback_monthly_captures - b.wayback_monthly_captures) * dir;
        case "first":
          return ((a.wayback_first_capture || "z") < (b.wayback_first_capture || "z") ? -1 : 1) * dir;
        case "links":
          return (a.external_link_count - b.external_link_count) * dir;
        case "keywords":
          return (a.keyword_count - b.keyword_count) * dir;
        case "title":
          return (a.slug < b.slug ? -1 : 1) * dir;
        default:
          return 0;
      }
    });

  // Build yearly capture chart data
  const yearlyData: { name: string; captures: number }[] = [];
  if (pages.length > 0) {
    const allYears: Record<string, number> = {};
    pages.forEach((p) => {
      const byYear = p.wayback_captures_by_year || {};
      Object.entries(byYear).forEach(([yr, count]) => {
        allYears[yr] = (allYears[yr] || 0) + (typeof count === "number" ? count : 0);
      });
    });
    Object.keys(allYears)
      .sort()
      .forEach((yr) => {
        yearlyData.push({ name: yr, captures: allYears[yr] });
      });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
        Error: {error}
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-[#F5F5F5]">
          Wikipedia SEO Pages Analysis
        </h1>
        <p className="text-[#F5F5F5]/60 mt-1">
          {pages.length} digital marketing Wikipedia pages — SERP rankings,
          external links, and Wayback Machine history
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Globe className="h-5 w-5 text-pink" />}
            label="Pages Analyzed"
            value={String(stats.total_pages)}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-pink" />}
            label="Wayback Captures"
            value={Number(stats.total_captures).toLocaleString()}
          />
          <StatCard
            icon={<Link2 className="h-5 w-5 text-pink" />}
            label="External Links"
            value={Number(stats.total_external_links).toLocaleString()}
          />
          <StatCard
            icon={<Calendar className="h-5 w-5 text-pink" />}
            label="Oldest Capture"
            value={stats.oldest_capture ? new Date(stats.oldest_capture).getFullYear().toString() : "—"}
          />
        </div>
      )}

      {/* Yearly Captures Chart */}
      {yearlyData.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-pink" />
            Wayback Captures by Year (All Pages)
          </h2>
          <div className="h-[250px]">
            <BarChart
              data={yearlyData}
              xAxisKey="name"
              dataKey="captures"
              color="#FF1493"
            />
          </div>
        </div>
      )}

      {/* Top External Domains */}
      {topDomains.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-pink" />
            Top Externally-Linked Domains
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {topDomains.slice(0, 12).map((d) => (
              <div
                key={d.domain}
                className="flex items-center justify-between bg-[#000022] rounded px-3 py-2 text-sm"
              >
                <span className="text-[#F5F5F5]/80 truncate">{d.domain}</span>
                <span className="text-pink font-medium ml-2">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter + Table */}
      <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg">
        <div className="p-4 border-b border-pink/10 flex items-center gap-3">
          <Search className="h-4 w-4 text-[#F5F5F5]/40" />
          <input
            type="text"
            placeholder="Filter pages..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-transparent text-[#F5F5F5] text-sm outline-none flex-1 placeholder:text-[#F5F5F5]/30"
          />
          <span className="text-[#F5F5F5]/40 text-xs">
            {sortedPages.length} pages
          </span>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-[#F5F5F5]/50 border-b border-pink/10">
          <button
            className="col-span-4 text-left hover:text-[#F5F5F5] transition-colors"
            onClick={() => toggleSort("title")}
          >
            Page <SortIcon field="title" />
          </button>
          <button
            className="col-span-2 text-right hover:text-[#F5F5F5] transition-colors"
            onClick={() => toggleSort("captures")}
          >
            Captures <SortIcon field="captures" />
          </button>
          <button
            className="col-span-2 text-right hover:text-[#F5F5F5] transition-colors"
            onClick={() => toggleSort("first")}
          >
            First Seen <SortIcon field="first" />
          </button>
          <button
            className="col-span-2 text-right hover:text-[#F5F5F5] transition-colors"
            onClick={() => toggleSort("links")}
          >
            Ext Links <SortIcon field="links" />
          </button>
          <button
            className="col-span-2 text-right hover:text-[#F5F5F5] transition-colors"
            onClick={() => toggleSort("keywords")}
          >
            Keywords <SortIcon field="keywords" />
          </button>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-pink/5">
          {sortedPages.map((page) => {
            const isExpanded = expandedSlug === page.slug;
            const name = page.slug.replace(/_/g, " ");
            const firstDate = page.wayback_first_capture
              ? new Date(page.wayback_first_capture).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })
              : "—";

            return (
              <div key={page.slug}>
                <button
                  className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-[#F5F5F5]/5 transition-colors text-left"
                  onClick={() =>
                    setExpandedSlug(isExpanded ? null : page.slug)
                  }
                >
                  <div className="col-span-4 flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-pink shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#F5F5F5]/30 shrink-0" />
                    )}
                    <span className="text-[#F5F5F5] font-medium truncate">
                      {name}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-[#F5F5F5]/70">
                    {page.wayback_monthly_captures || "—"}
                  </div>
                  <div className="col-span-2 text-right text-[#F5F5F5]/70">
                    {firstDate}
                  </div>
                  <div className="col-span-2 text-right text-[#F5F5F5]/70">
                    {page.external_link_count || "—"}
                  </div>
                  <div className="col-span-2 text-right text-[#F5F5F5]/70">
                    {page.keyword_count || "—"}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-[#000022]/50 border-t border-pink/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {/* Wayback Info */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-heading font-semibold text-pink">
                          Wayback Machine
                        </h3>
                        <div className="text-xs text-[#F5F5F5]/60 space-y-1">
                          <p>
                            Monthly captures:{" "}
                            <span className="text-[#F5F5F5]">
                              {page.wayback_monthly_captures}
                            </span>
                          </p>
                          <p>
                            First capture:{" "}
                            <span className="text-[#F5F5F5]">{firstDate}</span>
                          </p>
                          {page.wayback_first_url && (
                            <a
                              href={page.wayback_first_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-pink hover:text-pink/80 transition-colors"
                            >
                              View first version{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {page.wayback_latest_url && (
                            <a
                              href={page.wayback_latest_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-pink hover:text-pink/80 transition-colors ml-4"
                            >
                              View latest{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {/* Year breakdown */}
                        {page.wayback_captures_by_year &&
                          Object.keys(page.wayback_captures_by_year).length >
                            0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(page.wayback_captures_by_year)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([yr, count]) => (
                                  <span
                                    key={yr}
                                    className="text-[10px] bg-pink/10 text-pink/80 px-1.5 py-0.5 rounded"
                                  >
                                    {yr}: {count as number}
                                  </span>
                                ))}
                            </div>
                          )}
                      </div>

                      {/* SERP Rankings */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-heading font-semibold text-pink">
                          SERP Rankings
                        </h3>
                        {page.serp_keywords &&
                        Array.isArray(page.serp_keywords) &&
                        page.serp_keywords.length > 0 ? (
                          <div className="space-y-1">
                            {page.serp_keywords.map(
                              (kw: { keyword: string; position: number }, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-[#F5F5F5]/70">
                                    {kw.keyword}
                                  </span>
                                  <span className="text-pink font-medium">
                                    #{kw.position}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#F5F5F5]/40">
                            No ranking data
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-pink/10 flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/wiki-analysis/${page.slug}`);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-pink hover:text-pink/80 transition-colors"
                      >
                        Deep Analysis <ArrowRight className="h-3 w-3" />
                      </button>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#F5F5F5]/40 hover:text-pink transition-colors"
                      >
                        Wikipedia <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-[#F5F5F5]/50">{label}</span>
      </div>
      <p className="text-xl font-heading font-bold text-[#F5F5F5]">{value}</p>
    </div>
  );
}
