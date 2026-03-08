"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart } from "@/components/charts/BarChart";
import { TrendingUp, Search, RefreshCw, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";

interface TrackedKeyword {
  id: string;
  keyword: string;
  domain: string;
  user_id: string | null;
  last_position: number | null;
  last_checked_at: string | null;
  search_volume: number | null;
  annual_volume: number | null;
  monthly_searches: { year: number; month: number; search_volume: number }[] | null;
  competition: string | null;
  keyword_difficulty: number | null;
  volume_updated_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  ranked: number;
  notRanked: number;
  avgPosition: number | null;
  top10: number;
  top3: number;
  totalVolume: number;
  avgVolume: number | null;
}

interface ApiResponse {
  keywords: TrackedKeyword[];
  domain: string;
  domains: string[];
  stats: Stats;
}

interface Competitor {
  competitor_domain: string;
  avg_position: number | null;
  intersections: number | null;
}

interface TrafficEstimate {
  organic_etv: number | null;
  organic_count: number | null;
}

interface RelatedKeyword {
  related_keyword: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  competition: number | null;
}

interface DomainMetrics {
  competitors: Competitor[];
  traffic: TrafficEstimate | null;
  relatedKeywords: RelatedKeyword[];
}

type SortKey = "keyword" | "last_position" | "last_checked_at" | "search_volume" | "annual_volume" | "keyword_difficulty";
type SortDir = "asc" | "desc";
type Tab = "keywords" | "related";

function getPositionColor(pos: number | null): string {
  if (pos === null) return "text-gray-500";
  if (pos <= 3) return "text-green-400";
  if (pos <= 10) return "text-blue-400";
  if (pos <= 20) return "text-yellow-400";
  if (pos <= 50) return "text-orange-400";
  return "text-red-400/70";
}

function getKdColor(kd: number | null): string {
  if (kd === null) return "text-[#F5F5F5]/40";
  if (kd <= 30) return "text-green-400";
  if (kd <= 60) return "text-yellow-400";
  if (kd <= 80) return "text-orange-400";
  return "text-red-400";
}

function buildDistributionData(keywords: TrackedKeyword[]) {
  const buckets = [
    { bucket: "Top 3", count: 0 },
    { bucket: "4-10", count: 0 },
    { bucket: "11-20", count: 0 },
    { bucket: "21-50", count: 0 },
    { bucket: "51-100", count: 0 },
    { bucket: "Not ranking", count: 0 },
  ];
  for (const kw of keywords) {
    const p = kw.last_position;
    if (p === null) buckets[5].count++;
    else if (p <= 3) buckets[0].count++;
    else if (p <= 10) buckets[1].count++;
    else if (p <= 20) buckets[2].count++;
    else if (p <= 50) buckets[3].count++;
    else buckets[4].count++;
  }
  return buckets;
}

function formatDate(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function VolumeTrend({ monthly }: { monthly: { year: number; month: number; search_volume: number }[] | null }) {
  if (!monthly || monthly.length < 6) return <span className="text-[#F5F5F5]/30">—</span>;
  const sorted = [...monthly].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const last3 = sorted.slice(-3).reduce((s, m) => s + m.search_volume, 0);
  const prior3 = sorted.slice(-6, -3).reduce((s, m) => s + m.search_volume, 0);
  if (last3 > prior3 * 1.05) return <span className="text-green-400 text-base">↑</span>;
  if (last3 < prior3 * 0.95) return <span className="text-red-400 text-base">↓</span>;
  return <span className="text-[#F5F5F5]/40 text-base">→</span>;
}

const PAGE_SIZE = 50;

export function RankTrackerDashboard({ defaultDomain }: { defaultDomain: string }) {
  const [domain, setDomain] = useState(defaultDomain);
  const [domains, setDomains] = useState<string[]>([defaultDomain]);
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [fetchingVolume, setFetchingVolume] = useState(false);
  const [fetchingKD, setFetchingKD] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("keywords");

  // Domain Metrics
  const [metricsOpen, setMetricsOpen] = useState(true);
  const [metrics, setMetrics] = useState<DomainMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);

  async function fetchData(d: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/rank-tracker?domain=${encodeURIComponent(d)}`);
      const data: ApiResponse = await res.json();
      setKeywords(data.keywords);
      setStats(data.stats);
      setDomains(data.domains?.length ? data.domains : [d]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics(d: string) {
    setLoadingMetrics(true);
    try {
      const res = await fetch(`/api/dashboard/dmetrics?domain=${encodeURIComponent(d)}`);
      const data: DomainMetrics = await res.json();
      setMetrics(data);
    } finally {
      setLoadingMetrics(false);
    }
  }

  useEffect(() => {
    fetchData(domain);
    fetchMetrics(domain);
  }, [domain]);

  async function refreshMetrics() {
    setFetchingMetrics(true);
    try {
      await fetch("/api/dashboard/dmetrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      await fetchMetrics(domain);
    } finally {
      setFetchingMetrics(false);
    }
  }

  async function checkPositions(all = false) {
    setChecking(true);
    try {
      if (all) {
        await fetch("/api/dashboard/rank-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, checkAll: true }),
        });
      } else {
        const nullKeywords = keywords.filter((k) => !k.last_checked_at).slice(0, 10);
        if (nullKeywords.length === 0) return;
        await fetch("/api/dashboard/rank-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, keywords: nullKeywords.map((k) => k.keyword) }),
        });
      }
      await fetchData(domain);
    } finally {
      setChecking(false);
    }
  }

  async function fetchVolume() {
    setFetchingVolume(true);
    try {
      await fetch("/api/dashboard/rank-tracker/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, limit: 100 }),
      });
      await fetchData(domain);
    } finally {
      setFetchingVolume(false);
    }
  }

  async function fetchDifficulty() {
    setFetchingKD(true);
    try {
      await fetch("/api/dashboard/rank-tracker/kd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      await fetchData(domain);
    } finally {
      setFetchingKD(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = keywords.filter((k) =>
      k.keyword.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (sortKey === "last_position") {
        av = av === null ? 999999 : av;
        bv = bv === null ? 999999 : bv;
      }
      if (sortKey === "search_volume" || sortKey === "annual_volume" || sortKey === "keyword_difficulty") {
        av = av === null ? -1 : av;
        bv = bv === null ? -1 : bv;
      }
      if (av === null || av === undefined) av = "";
      if (bv === null || bv === undefined) bv = "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [keywords, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const distData = useMemo(() => buildDistributionData(keywords), [keywords]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="opacity-30">↕</span>;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline" /> : <ChevronDown className="h-3 w-3 inline" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-pink-500" />
          <h1 className="font-heading text-2xl text-[#F5F5F5]">Rank Tracker</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={domain}
            onChange={(e) => { setDomain(e.target.value); setPage(1); }}
            className="bg-[#000022] border border-pink-500/30 text-[#F5F5F5] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
          >
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            onClick={fetchVolume}
            disabled={fetchingVolume || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Search className={`h-4 w-4 ${fetchingVolume ? "animate-pulse" : ""}`} />
            {fetchingVolume ? "Fetching…" : "Fetch Volume"}
          </button>
          <button
            onClick={fetchDifficulty}
            disabled={fetchingKD || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Search className={`h-4 w-4 ${fetchingKD ? "animate-pulse" : ""}`} />
            {fetchingKD ? "Fetching KD…" : "Fetch KD"}
          </button>
          <button
            onClick={() => checkPositions(false)}
            disabled={checking || loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF1493] hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Check 10"}
          </button>
          <button
            onClick={() => checkPositions(true)}
            disabled={checking || loading}
            title={`Check all ${keywords.filter(k => !k.last_checked_at).length} unchecked keywords`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking all…" : `Check All (${keywords.filter(k => !k.last_checked_at).length})`}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Keywords", value: stats?.total ?? "—" },
          { label: "Ranking", value: stats?.ranked ?? "—" },
          { label: "Top 10", value: stats?.top10 ?? "—" },
          { label: "Avg Position", value: stats?.avgPosition ?? "—" },
          { label: "Avg Monthly Vol", value: stats?.avgVolume != null ? stats.avgVolume.toLocaleString() : "—" },
          { label: "Total Monthly Vol", value: stats?.totalVolume ? stats.totalVolume.toLocaleString() : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#000033] border border-pink-500/20 rounded-xl p-4">
            <p className="text-[#F5F5F5]/50 text-xs uppercase tracking-wide mb-1">{label}</p>
            <p className="text-[#F5F5F5] text-2xl font-bold">{loading ? "…" : value}</p>
          </div>
        ))}
      </div>

      {/* Domain Metrics Section */}
      <div className="bg-[#000033] border border-pink-500/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setMetricsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F5F5F5]/2 transition-colors"
        >
          <span className="font-heading text-[#F5F5F5] text-lg">Domain Metrics</span>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); refreshMetrics(); }}
              disabled={fetchingMetrics}
              className="flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${fetchingMetrics ? "animate-spin" : ""}`} />
              {fetchingMetrics ? "Fetching…" : "Refresh Data"}
            </button>
            <ChevronRight className={`h-5 w-5 text-[#F5F5F5]/50 transition-transform ${metricsOpen ? "rotate-90" : ""}`} />
          </div>
        </button>
        {metricsOpen && (
          <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traffic Estimate */}
            <div className="bg-[#000022] border border-pink-500/10 rounded-xl p-4">
              <p className="text-[#F5F5F5]/50 text-xs uppercase tracking-wide mb-2">Organic Traffic Estimate (ETV)</p>
              {loadingMetrics ? (
                <p className="text-[#F5F5F5]/30 text-sm">Loading…</p>
              ) : metrics?.traffic ? (
                <div>
                  <p className="text-[#FF1493] text-3xl font-bold">
                    {metrics.traffic.organic_etv != null ? Math.round(metrics.traffic.organic_etv).toLocaleString() : "—"}
                  </p>
                  <p className="text-[#F5F5F5]/40 text-xs mt-1">
                    {metrics.traffic.organic_count != null ? `${metrics.traffic.organic_count.toLocaleString()} organic keywords` : ""}
                  </p>
                </div>
              ) : (
                <p className="text-[#F5F5F5]/30 text-sm">No data — click Refresh Data to fetch</p>
              )}
            </div>

            {/* Top Competitors */}
            <div className="bg-[#000022] border border-pink-500/10 rounded-xl p-4">
              <p className="text-[#F5F5F5]/50 text-xs uppercase tracking-wide mb-2">Top Competitors</p>
              {loadingMetrics ? (
                <p className="text-[#F5F5F5]/30 text-sm">Loading…</p>
              ) : metrics?.competitors && metrics.competitors.length > 0 ? (
                <ul className="space-y-1.5">
                  {metrics.competitors.slice(0, 5).map((c) => (
                    <li key={c.competitor_domain} className="flex items-center justify-between text-sm">
                      <span className="text-[#F5F5F5]/80 truncate">{c.competitor_domain}</span>
                      <span className="text-[#F5F5F5]/40 text-xs ml-2 whitespace-nowrap">
                        avg #{c.avg_position != null ? Math.round(c.avg_position) : "—"} · {c.intersections ?? "—"} kws
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#F5F5F5]/30 text-sm">No data — click Refresh Data to fetch</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Distribution chart */}
      <div className="bg-[#000033] border border-pink-500/20 rounded-xl p-5">
        <h2 className="font-heading text-[#F5F5F5] text-lg mb-4">Position Distribution</h2>
        <BarChart
          data={distData}
          dataKey="count"
          xAxisKey="bucket"
          color="#FF1493"
          height={200}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-pink-500/20">
        {([["keywords", "Keywords"], ["related", "Related Keywords"]] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#FF1493] text-[#FF1493]"
                : "border-transparent text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Keywords Table */}
      {activeTab === "keywords" && (
        <div className="bg-[#000033] border border-pink-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/40" />
              <input
                type="text"
                placeholder="Filter keywords…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-[#000022] border border-pink-500/20 text-[#F5F5F5] text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-pink-500/50 placeholder:text-[#F5F5F5]/30"
              />
            </div>
            <span className="text-[#F5F5F5]/40 text-sm">{filtered.length} keywords</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pink-500/20">
                  {[
                    { key: "keyword" as SortKey, label: "Keyword" },
                    { key: "last_position" as SortKey, label: "Position" },
                    { key: null, label: "Change" },
                    { key: "search_volume" as SortKey, label: "Monthly Vol" },
                    { key: "annual_volume" as SortKey, label: "Annual Vol" },
                    { key: "keyword_difficulty" as SortKey, label: "KD" },
                    { key: null, label: "Trend" },
                    { key: "last_checked_at" as SortKey, label: "Last Checked" },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={() => key && handleSort(key)}
                      className={`text-left py-2 px-3 text-[#F5F5F5]/50 font-medium uppercase text-xs tracking-wide ${key ? "cursor-pointer hover:text-[#F5F5F5] select-none" : ""}`}
                    >
                      {label} {key && <SortIcon col={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#F5F5F5]/40">Loading…</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#F5F5F5]/40">No keywords found</td>
                  </tr>
                ) : (
                  paginated.map((kw) => (
                    <tr key={kw.id} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/2">
                      <td className="py-2.5 px-3 text-[#F5F5F5]/80">{kw.keyword}</td>
                      <td className={`py-2.5 px-3 font-mono font-bold ${getPositionColor(kw.last_position)}`}>
                        {kw.last_position !== null
                          ? kw.last_position
                          : kw.last_checked_at
                            ? <span className="text-xs font-normal text-[#F5F5F5]/30">NR</span>
                            : <span className="text-xs font-normal text-[#F5F5F5]/20">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-[#F5F5F5]/40">—</td>
                      <td className="py-2.5 px-3 text-[#F5F5F5]/70 font-mono">
                        {kw.search_volume?.toLocaleString() ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#F5F5F5]/70 font-mono">
                        {kw.annual_volume?.toLocaleString() ?? "—"}
                      </td>
                      <td className={`py-2.5 px-3 font-mono font-semibold ${getKdColor(kw.keyword_difficulty)}`}>
                        {kw.keyword_difficulty !== null ? kw.keyword_difficulty : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <VolumeTrend monthly={kw.monthly_searches} />
                      </td>
                      <td className="py-2.5 px-3 text-[#F5F5F5]/50">{formatDate(kw.last_checked_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-pink-500/10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm text-[#F5F5F5]/60 hover:text-[#F5F5F5] disabled:opacity-30 border border-[#F5F5F5]/10 rounded-lg"
              >
                Previous
              </button>
              <span className="text-[#F5F5F5]/50 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm text-[#F5F5F5]/60 hover:text-[#F5F5F5] disabled:opacity-30 border border-[#F5F5F5]/10 rounded-lg"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Related Keywords Tab */}
      {activeTab === "related" && (
        <div className="bg-[#000033] border border-pink-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[#F5F5F5] text-lg">Related Keywords</h2>
            <button
              onClick={refreshMetrics}
              disabled={fetchingMetrics}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF1493] hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${fetchingMetrics ? "animate-spin" : ""}`} />
              {fetchingMetrics ? "Discovering…" : "Discover Related"}
            </button>
          </div>
          {loadingMetrics ? (
            <p className="text-center py-12 text-[#F5F5F5]/40">Loading…</p>
          ) : !metrics?.relatedKeywords || metrics.relatedKeywords.length === 0 ? (
            <p className="text-center py-12 text-[#F5F5F5]/40">
              No related keywords yet — click &quot;Discover Related&quot; to fetch from DataForSEO.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pink-500/20">
                    {["Keyword", "Volume", "KD", "Competition"].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-[#F5F5F5]/50 font-medium uppercase text-xs tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.relatedKeywords.map((rk, i) => (
                    <tr key={i} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/2">
                      <td className="py-2.5 px-3 text-[#F5F5F5]/80">{rk.related_keyword}</td>
                      <td className="py-2.5 px-3 text-[#F5F5F5]/70 font-mono">
                        {rk.search_volume?.toLocaleString() ?? "—"}
                      </td>
                      <td className={`py-2.5 px-3 font-mono font-semibold ${getKdColor(rk.keyword_difficulty)}`}>
                        {rk.keyword_difficulty !== null ? rk.keyword_difficulty : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#F5F5F5]/60 font-mono">
                        {rk.competition !== null ? rk.competition : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
