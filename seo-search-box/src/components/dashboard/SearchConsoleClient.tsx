"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Globe,
  TrendingUp,
  MousePointer,
  Eye,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Link2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { AreaChart } from "@/components/charts/AreaChart";
import { cn } from "@/lib/utils";

const API_BASE = "https://api.seobandwagon.dev";

interface GSCStatus {
  connected: boolean;
  email?: string;
  gsc_connected?: boolean;
}

interface Site {
  siteUrl: string;
  permissionLevel: string;
}

interface QueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface TrendData {
  date: string;
  clicks: number;
  impressions: number;
}

interface SearchConsoleClientProps {
  userEmail: string;
}

export function SearchConsoleClient({ userEmail }: SearchConsoleClientProps) {
  const [status, setStatus] = useState<GSCStatus | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queries" | "pages">("queries");

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, [userEmail]);

  // Load data when site is selected
  useEffect(() => {
    if (selectedSite && status?.connected) {
      loadData();
    }
  }, [selectedSite]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/status?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setStatus(data);

      if (data.connected) {
        await loadSites();
      }
    } catch (err) {
      setError("Failed to check connection status");
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const res = await fetch(`${API_BASE}/gsc/sites?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.details || data.error);
        return;
      }
      
      setSites(data.sites || []);
      if (data.sites?.length > 0) {
        setSelectedSite(data.sites[0].siteUrl);
      }
    } catch (err) {
      setError("Failed to load sites");
    }
  };

  const loadData = async () => {
    if (!selectedSite) return;
    
    setLoading(true);
    try {
      const [queriesRes, pagesRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}/gsc/queries?email=${encodeURIComponent(userEmail)}&siteUrl=${encodeURIComponent(selectedSite)}`),
        fetch(`${API_BASE}/gsc/pages?email=${encodeURIComponent(userEmail)}&siteUrl=${encodeURIComponent(selectedSite)}`),
        fetch(`${API_BASE}/gsc/trend?email=${encodeURIComponent(userEmail)}&siteUrl=${encodeURIComponent(selectedSite)}`),
      ]);

      const [queriesData, pagesData, trendData] = await Promise.all([
        queriesRes.json(),
        pagesRes.json(),
        trendRes.json(),
      ]);

      setQueries(queriesData.queries || []);
      setPages(pagesData.pages || []);
      setTrend(trendData.trend || []);
      setError(null);
    } catch (err) {
      setError("Failed to load Search Console data");
    } finally {
      setLoading(false);
    }
  };

  const connectGSC = () => {
    const callbackUrl = `${window.location.origin}/api/gsc/callback`;
    window.location.href = `${API_BASE}/auth/google?redirect=${encodeURIComponent(callbackUrl)}`;
  };

  // Calculate totals
  const totalClicks = queries.reduce((sum, q) => sum + q.clicks, 0);
  const totalImpressions = queries.reduce((sum, q) => sum + q.impressions, 0);
  const avgPosition = queries.length > 0 
    ? (queries.reduce((sum, q) => sum + q.position, 0) / queries.length).toFixed(1)
    : "0";
  const avgCtr = totalImpressions > 0 
    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
    : "0";

  // Not connected state
  if (!loading && (!status?.connected || !status?.gsc_connected)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Search className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Connect Google Search Console
          </h1>
          <p className="text-slate-400 mb-8">
            Link your Search Console account to see your search performance data,
            top queries, and pages.
          </p>
          <button
            onClick={connectGSC}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Globe className="w-5 h-5" />
            Connect Search Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Search Console</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Connected as {userEmail}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {sites.length > 1 && (
            <select
              value={selectedSite || ""}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            >
              {sites.map((site) => (
                <option key={site.siteUrl} value={site.siteUrl}>
                  {site.siteUrl.replace(/^sc-domain:|https?:\/\//, "")}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={connectGSC} className="ml-auto text-sm text-blue-400 hover:underline">
            Reconnect
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MousePointer} label="Total Clicks" value={totalClicks.toLocaleString()} />
        <StatCard icon={Eye} label="Total Impressions" value={totalImpressions.toLocaleString()} />
        <StatCard icon={TrendingUp} label="Avg. CTR" value={`${avgCtr}%`} />
        <StatCard icon={BarChart3} label="Avg. Position" value={avgPosition} />
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Performance Trend (Last 28 Days)</h2>
        {trend.length > 0 ? (
          <AreaChart
            data={trend.map(t => ({ ...t, date: t.date.slice(5) }))}
            dataKey="clicks"
            xAxisKey="date"
            color="#3b82f6"
            height={250}
          />
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-500">
            No trend data available
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("queries")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === "queries"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
        >
          Top Queries
        </button>
        <button
          onClick={() => setActiveTab("pages")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === "pages"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
        >
          Top Pages
        </button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">
                {activeTab === "queries" ? "Query" : "Page"}
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Clicks</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Impressions</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">CTR</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Position</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === "queries" ? queries : pages).slice(0, 20).map((item, idx) => (
              <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {activeTab === "queries" ? (
                      <Search className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Link2 className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-white text-sm truncate max-w-[300px]">
                      {activeTab === "queries" 
                        ? (item as QueryData).query 
                        : (item as PageData).page.replace(selectedSite || "", "")}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">
                  {item.clicks.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">
                  {item.impressions.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">
                  {(item.ctr * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">
                  {item.position.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(activeTab === "queries" ? queries : pages).length === 0 && (
          <div className="py-12 text-center text-slate-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MousePointer;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
