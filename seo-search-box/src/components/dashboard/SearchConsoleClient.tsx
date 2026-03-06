"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  ExternalLink,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Target,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { AreaChart } from "@/components/charts/AreaChart";

type DateRange = "7d" | "28d" | "3m";

interface GscStatus {
  connected: boolean;
  email?: string;
  gsc_connected?: boolean;
}

interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PerformancePoint {
  [key: string]: string | number;
  date: string;
  clicks: number;
  impressions: number;
}

interface SearchConsoleClientProps {
  userEmail: string;
}

export function SearchConsoleClient({ userEmail }: SearchConsoleClientProps) {
  const [gscStatus, setGscStatus] = useState<GscStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("28d");
  const [site, setSite] = useState<string>("");
  const [allSites, setAllSites] = useState<string[]>([]);

  // TODO: Replace with real GSC API proxy once /api/gsc route is built
  // These will be populated by fetching from api.seobandwagon.dev GSC tools
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [performance, setPerformance] = useState<PerformancePoint[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [avgCtr, setAvgCtr] = useState(0);
  const [avgPosition, setAvgPosition] = useState(0);

  useEffect(() => {
    checkConnection();
  }, []);

  // Step 1: load sites once connected
  useEffect(() => {
    if (gscStatus?.connected) {
      loadSites();
    }
  }, [gscStatus?.connected]);

  // Step 2: fetch data when site or dateRange changes
  useEffect(() => {
    if (site) {
      fetchGscData(site);
    }
  }, [site, dateRange]);

  const checkConnection = async () => {
    try {
      const res = await fetch(
        `https://api.seobandwagon.dev/auth/status?email=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();
      setGscStatus(data);
    } catch {
      setGscStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const email = encodeURIComponent(userEmail);
      const sitesRes = await fetch(`https://api.seobandwagon.dev/api/gsc/sites?email=${email}`);
      const sitesData = await sitesRes.json();
      const sites: string[] = (sitesData.sites || []).map((s: { siteUrl: string }) => s.siteUrl);
      setAllSites(sites);
      const persisted = localStorage.getItem("gsc_selected_site");
      const siteUrl = (persisted && sites.includes(persisted)) ? persisted : sites[0];
      if (siteUrl) {
        setSite(siteUrl);
        localStorage.setItem("gsc_selected_site", siteUrl);
      }
    } catch (err) {
      console.error("Failed to load GSC sites:", err);
    }
  };

  const fetchGscData = async (siteUrl: string) => {
    setLoading(true);
    try {
      const email = encodeURIComponent(userEmail);
      const site = encodeURIComponent(siteUrl);

      const [queriesRes, pagesRes, perfRes] = await Promise.allSettled([
        fetch(
          `https://api.seobandwagon.dev/api/gsc/queries?email=${email}&site=${site}&range=${dateRange}`
        ).then((r) => r.json()),
        fetch(
          `https://api.seobandwagon.dev/api/gsc/pages?email=${email}&site=${site}&range=${dateRange}`
        ).then((r) => r.json()),
        fetch(
          `https://api.seobandwagon.dev/api/gsc/performance?email=${email}&site=${site}&range=${dateRange}`
        ).then((r) => r.json()),
      ]);

      if (queriesRes.status === "fulfilled") setQueries(queriesRes.value.queries || []);
      if (pagesRes.status === "fulfilled") setPages(pagesRes.value.pages || []);
      if (perfRes.status === "fulfilled") {
        setPerformance(perfRes.value.performance || []);
        const t = perfRes.value.totals;
        if (t) {
          setTotalClicks(t.clicks || 0);
          setTotalImpressions(t.impressions || 0);
          setAvgCtr(t.avgCtr || 0);
          setAvgPosition(t.avgPosition || 0);
        }
      }
    } catch (err) {
      console.error("GSC data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectGsc = () => {
    const redirect = encodeURIComponent(window.location.origin + "/dashboard/search-console");
    window.location.href = `https://api.seobandwagon.dev/auth/google?redirect=${redirect}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-pink animate-spin" />
      </div>
    );
  }

  if (!gscStatus?.connected) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 mx-auto mb-6">
          <Search className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide mb-3">
          Connect Google Search Console
        </h1>
        <p className="text-[#F5F5F5]/50 text-sm mb-8 max-w-sm mx-auto">
          Link your Search Console account to see your pages, queries, clicks,
          impressions, and ranking data right here.
        </p>
        <button
          onClick={connectGsc}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors border-none cursor-pointer"
        >
          Connect Search Console
          <ExternalLink className="h-4 w-4" />
        </button>
        <p className="text-xs text-[#F5F5F5]/30 mt-4">
          We request read-only access to your Search Console data.
        </p>
      </div>
    );
  }

  const hasData = queries.length > 0 || pages.length > 0;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">
            Search Console
          </h1>
          <p className="text-sm text-[#F5F5F5]/40 mt-1">
            Connected as {gscStatus.email || userEmail}
          </p>
        </div>

        {/* Site Selector */}
        {allSites.length > 1 && (
          <select
            value={site}
            onChange={(e) => {
              const val = e.target.value;
              setSite(val);
              localStorage.setItem("gsc_selected_site", val);
            }}
            className="bg-[#F5F5F5]/5 border border-pink/30 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] cursor-pointer"
          >
            {allSites.map((s) => (
              <option key={s} value={s} className="bg-[#000022]">
                {s.replace(/^sc-domain:|https?:\/\//, "")}
              </option>
            ))}
          </select>
        )}

        {/* Date Range */}
        <div className="flex items-center gap-1 bg-[#F5F5F5]/5 rounded-lg p-1">
          {(["7d", "28d", "3m"] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border-none cursor-pointer ${
                dateRange === range
                  ? "bg-pink text-white"
                  : "bg-transparent text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "28d" ? "28 Days" : "3 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={MousePointerClick}
          label="Total Clicks"
          value={totalClicks.toLocaleString()}
          color="text-blue-400"
        />
        <MetricCard
          icon={Eye}
          label="Total Impressions"
          value={totalImpressions.toLocaleString()}
          color="text-purple-400"
        />
        <MetricCard
          icon={Target}
          label="Avg CTR"
          value={`${(avgCtr * 100).toFixed(1)}%`}
          color="text-green-400"
        />
        <MetricCard
          icon={BarChart3}
          label="Avg Position"
          value={avgPosition.toFixed(1)}
          color="text-orange-400"
        />
      </div>

      {/* Performance Chart */}
      <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6 mb-8">
        <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
          Performance
        </h2>
        {performance.length > 0 ? (
          <AreaChart
            data={performance}
            dataKey="clicks"
            xAxisKey="date"
            color="#FF1493"
            height={250}
          />
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center text-[#F5F5F5]/30">
            <AlertCircle className="h-8 w-8 mb-3" />
            <p className="text-sm">
              No performance data for this period yet.
            </p>
          </div>
        )}
      </div>

      {/* Tabbed Queries / Pages Table */}
      <GscDataTable queries={queries} pages={pages} />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Search;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-[#F5F5F5]/40">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#F5F5F5]">{value}</p>
    </div>
  );
}

function EmptyTable({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-[#F5F5F5]/30 text-sm">{message}</p>
    </div>
  );
}

type SortKey = "clicks" | "impressions" | "ctr" | "position";
type SortDir = "asc" | "desc";

function GscDataTable({ queries, pages }: { queries: QueryRow[]; pages: PageRow[] }) {
  const [tab, setTab] = useState<"queries" | "pages">("queries");
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-30 inline ml-1" />;
    return sortDir === "desc"
      ? <TrendingDown className="h-3 w-3 text-pink inline ml-1" />
      : <TrendingUp className="h-3 w-3 text-pink inline ml-1" />;
  };

  const rows = tab === "queries"
    ? queries
        .filter((q) => q.query.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])
    : pages
        .filter((p) => p.page.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);

  const labelKey = tab === "queries" ? "query" : "page";

  return (
    <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
      {/* Tabs + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex gap-1 bg-[#F5F5F5]/5 rounded-lg p-1 w-fit">
          {(["queries", "pages"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setFilter(""); }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors border-none cursor-pointer capitalize ${
                tab === t ? "bg-pink text-white" : "bg-transparent text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
              }`}
            >
              {t === "queries" ? `Queries (${queries.length})` : `Pages (${pages.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#F5F5F5]/30" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${tab}…`}
            className="w-full bg-[#F5F5F5]/5 border border-pink/20 rounded-lg pl-7 pr-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#F5F5F5]/30 outline-none focus:border-pink/50"
          />
        </div>
        <span className="text-xs text-[#F5F5F5]/30 ml-auto">{rows.length} results</span>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pink/20">
                <th className="text-left py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  {tab === "queries" ? "Query" : "Page"}
                </th>
                {(["clicks", "impressions", "ctr", "position"] as SortKey[]).map((key) => (
                  <th key={key} className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase cursor-pointer hover:text-pink select-none"
                      onClick={() => handleSort(key)}>
                    {key === "ctr" ? "CTR" : key === "position" ? "Pos" : key.charAt(0).toUpperCase() + key.slice(1)}
                    {sortIcon(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const label = tab === "queries" ? (row as QueryRow).query : (row as PageRow).page;
                const display = tab === "pages" ? label.replace(/^https?:\/\//, "") : label;
                return (
                  <tr key={i} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5">
                    <td className="py-2 px-2 text-sm text-[#F5F5F5] truncate max-w-[320px]" title={label}>
                      {tab === "pages"
                        ? <a href={label} target="_blank" rel="noopener noreferrer" className="hover:text-pink transition-colors">{display}</a>
                        : display}
                    </td>
                    <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">{row.clicks.toLocaleString()}</td>
                    <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">{row.impressions.toLocaleString()}</td>
                    <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">{(row.ctr * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">{row.position.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyTable message={filter ? `No ${tab} match "${filter}"` : `Connect GSC to see your top ${tab}`} />
      )}
    </div>
  );
}
