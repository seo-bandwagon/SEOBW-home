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

  useEffect(() => {
    if (gscStatus?.connected) {
      fetchGscData();
    }
  }, [gscStatus?.connected, dateRange]);

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

  const fetchGscData = async () => {
    // TODO: Wire to /api/gsc proxy route that calls api.seobandwagon.dev GSC tools
    // For now, the UI is ready — just needs the API endpoint
    // The MCP server already has the GSC tools (src/tools/gsc.ts)
    // We need a Next.js API route that proxies requests:
    //   GET /api/gsc?type=queries&range=28d&email=user@example.com
    //   GET /api/gsc?type=pages&range=28d&email=user@example.com
    //   GET /api/gsc?type=performance&range=28d&email=user@example.com
    setLoading(false);
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
              {hasData
                ? "Performance chart loading..."
                : "No data yet. GSC data will appear once the API proxy is connected."}
            </p>
            <p className="text-xs mt-2 text-[#F5F5F5]/20">
              API integration in progress — dashboard UI is ready.
            </p>
          </div>
        )}
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Queries */}
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Top Queries
          </h2>
          {queries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pink/20">
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Query
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Clicks
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Impr
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      CTR
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Pos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q, i) => (
                    <tr key={i} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5">
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]">
                        {q.query}
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {q.clicks}
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {q.impressions}
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {(q.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {q.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyTable message="Connect GSC to see your top queries" />
          )}
        </div>

        {/* Top Pages */}
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Top Pages
          </h2>
          {pages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pink/20">
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Page
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Clicks
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Impr
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      CTR
                    </th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                      Pos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p, i) => (
                    <tr key={i} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5">
                      <td className="py-2 px-2 text-sm text-[#F5F5F5] truncate max-w-[200px]">
                        {p.page.replace(/^https?:\/\//, "")}
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {p.clicks}
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {p.impressions}
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {(p.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                        {p.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyTable message="Connect GSC to see your top pages" />
          )}
        </div>
      </div>
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
