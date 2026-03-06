"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  MousePointerClick,
  Eye,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { AreaChart } from "@/components/charts/AreaChart";

type DateRange = "7d" | "28d" | "3m";

interface Client {
  id: string;
  name: string;
  gsc_site_url: string | null;
  ga4_property_id: string | null;
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

interface PerformancePoint extends Record<string, string | number> {
  date: string;
  clicks: number;
  impressions: number;
}

export function ClientReport({
  clientId,
  userEmail,
}: {
  clientId: string;
  userEmail: string;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("28d");
  const [error, setError] = useState<string | null>(null);

  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [performance, setPerformance] = useState<PerformancePoint[]>([]);
  const [totals, setTotals] = useState({
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  });

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  useEffect(() => {
    if (client?.gsc_site_url) {
      fetchGscData();
    }
  }, [client, dateRange]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setClient(data.client);
      }
    } catch (err) {
      setError("Failed to load client");
    } finally {
      setLoading(false);
    }
  };

  const fetchGscData = async () => {
    if (!client?.gsc_site_url) return;

    setDataLoading(true);
    try {
      const site = encodeURIComponent(client.gsc_site_url);
      const email = encodeURIComponent(userEmail);

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

      if (queriesRes.status === "fulfilled") {
        setQueries(queriesRes.value.queries || []);
      }
      if (pagesRes.status === "fulfilled") {
        setPages(pagesRes.value.pages || []);
      }
      if (perfRes.status === "fulfilled") {
        setPerformance(perfRes.value.performance || []);
        const t = perfRes.value.totals;
        if (t) {
          setTotals({
            clicks: t.clicks || 0,
            impressions: t.impressions || 0,
            ctr: t.avgCtr || 0,
            position: t.avgPosition || 0,
          });
        }
      }
    } catch (err) {
      console.error("GSC data error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-pink animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-6xl">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-[#F5F5F5]/60 hover:text-[#F5F5F5] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="rounded-xl bg-[#000022] border-2 border-red-500/30 p-8 text-center">
          <p className="text-red-400">{error || "Client not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 text-[#F5F5F5]/60 hover:text-[#F5F5F5] text-sm mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Clients
          </Link>
          <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">
            {client.name}
          </h1>
          {client.gsc_site_url && (
            <p className="text-sm text-[#F5F5F5]/40 mt-1">
              {client.gsc_site_url.replace("sc-domain:", "")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={fetchGscData}
            disabled={dataLoading}
            className="p-2 rounded-lg bg-[#F5F5F5]/5 text-[#F5F5F5]/60 hover:text-[#F5F5F5] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!client.gsc_site_url ? (
        <div className="rounded-xl bg-[#000022] border-2 border-yellow-500/30 p-8 text-center">
          <p className="text-yellow-400">
            No GSC site configured for this client. Edit the client to add a GSC site URL.
          </p>
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              icon={MousePointerClick}
              label="Total Clicks"
              value={totals.clicks.toLocaleString()}
              color="text-blue-400"
            />
            <MetricCard
              icon={Eye}
              label="Impressions"
              value={totals.impressions.toLocaleString()}
              color="text-purple-400"
            />
            <MetricCard
              icon={Target}
              label="Avg CTR"
              value={`${(totals.ctr * 100).toFixed(1)}%`}
              color="text-green-400"
            />
            <MetricCard
              icon={BarChart3}
              label="Avg Position"
              value={totals.position.toFixed(1)}
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
              <div className="h-[250px] flex items-center justify-center text-[#F5F5F5]/30">
                {dataLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "No performance data available"
                )}
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
                          Pos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.slice(0, 10).map((q, i) => (
                        <tr key={i} className="border-b border-[#F5F5F5]/5">
                          <td className="py-2 px-2 text-sm text-[#F5F5F5]">{q.query}</td>
                          <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                            {q.clicks}
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
                <div className="h-[200px] flex items-center justify-center text-[#F5F5F5]/30">
                  {dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "No data"}
                </div>
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
                          Pos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-[#F5F5F5]/5">
                          <td className="py-2 px-2 text-sm text-[#F5F5F5] truncate max-w-[200px]">
                            {p.page.replace(/^https?:\/\/[^/]+/, "")}
                          </td>
                          <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                            {p.clicks}
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
                <div className="h-[200px] flex items-center justify-center text-[#F5F5F5]/30">
                  {dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "No data"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof MousePointerClick;
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
