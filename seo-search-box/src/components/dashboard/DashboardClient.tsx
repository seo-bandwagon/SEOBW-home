"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  TrendingUp,
  Globe,
  Bookmark,
  Clock,
  ArrowRight,
  Hash,
  Phone,
  Building2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { AreaChart } from "@/components/charts/AreaChart";
import { BarChart } from "@/components/charts/BarChart";
import { PieChart } from "@/components/charts/PieChart";
import { cn } from "@/lib/utils";

interface SearchStats {
  inputType: string;
  count: number;
}

interface TopKeyword {
  keyword: string;
  searchCount: number;
  avgSearchVolume: number | null;
}

interface TopDomain {
  domain: string;
  searchCount: number;
  latestRank: number | null;
}

interface RecentSearch {
  id: string;
  inputType: string;
  inputValue: string;
  createdAt: string;
}

interface AnalyticsOverview {
  stats: SearchStats[];
  topKeywords: TopKeyword[];
  topDomains: TopDomain[];
}

interface DashboardClientProps {
  userName?: string;
  recentSearches: RecentSearch[];
  savedSearchCount: number;
}

const TYPE_COLORS: Record<string, string> = {
  keyword: "#3b82f6", // blue
  url: "#22c55e", // green
  phone: "#f59e0b", // amber
  business: "#8b5cf6", // violet
};

const TYPE_ICONS: Record<string, typeof Hash> = {
  keyword: Hash,
  url: Globe,
  phone: Phone,
  business: Building2,
};

export function DashboardClient({
  userName,
  recentSearches,
  savedSearchCount,
}: DashboardClientProps) {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics?type=overview");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals from stats
  const totalSearches = analytics?.stats.reduce((sum, s) => sum + s.count, 0) || 0;
  const keywordCount = analytics?.stats.find((s) => s.inputType === "keyword")?.count || 0;
  const domainCount = analytics?.stats.find((s) => s.inputType === "url")?.count || 0;

  // Prepare pie chart data
  const pieData =
    analytics?.stats.map((s) => ({
      name: s.inputType.charAt(0).toUpperCase() + s.inputType.slice(1),
      value: s.count,
      color: TYPE_COLORS[s.inputType] || "#64748b",
    })) || [];

  // Prepare bar chart data for top keywords
  const keywordBarData =
    analytics?.topKeywords.map((k) => ({
      name: k.keyword.length > 15 ? k.keyword.slice(0, 15) + "..." : k.keyword,
      fullName: k.keyword,
      searches: k.searchCount,
      volume: k.avgSearchVolume || 0,
    })) || [];

  // Prepare bar chart data for top domains
  const domainBarData =
    analytics?.topDomains.map((d) => ({
      name: d.domain.length > 20 ? d.domain.slice(0, 20) + "..." : d.domain,
      fullName: d.domain,
      searches: d.searchCount,
      rank: d.latestRank || 0,
    })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {userName || "User"}
          </h1>
          <p className="text-slate-400 mt-1">
            {"Here's an overview of your SEO research activity"}
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
          <span className="text-slate-300 text-sm">Refresh</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/"
          className="flex items-center gap-3 p-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Search className="h-6 w-6 text-white" />
          <span className="text-white font-medium">New Search</span>
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <Clock className="h-6 w-6 text-slate-400" />
          <span className="text-white font-medium">View History</span>
        </Link>
        <Link
          href="/saved"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <Bookmark className="h-6 w-6 text-slate-400" />
          <span className="text-white font-medium">Saved Searches</span>
        </Link>
        <Link
          href="/alerts"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <TrendingUp className="h-6 w-6 text-slate-400" />
          <span className="text-white font-medium">Manage Alerts</span>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Search}
          label="Total Searches"
          value={totalSearches}
          loading={loading}
        />
        <StatCard
          icon={Hash}
          label="Keywords Analyzed"
          value={keywordCount}
          loading={loading}
        />
        <StatCard
          icon={Globe}
          label="Domains Analyzed"
          value={domainCount}
          loading={loading}
        />
        <StatCard
          icon={Bookmark}
          label="Saved Searches"
          value={savedSearchCount}
          loading={loading}
        />
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Search Type Distribution */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Search Types</h2>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-slate-500 animate-spin" />
            </div>
          ) : pieData.length > 0 ? (
            <PieChart data={pieData} height={200} innerRadius={50} outerRadius={70} />
          ) : (
            <EmptyState message="No search data yet" />
          )}
        </div>

        {/* Top Keywords */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Keywords</h2>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-slate-500 animate-spin" />
            </div>
          ) : keywordBarData.length > 0 ? (
            <BarChart
              data={keywordBarData}
              dataKey="searches"
              xAxisKey="name"
              color="#3b82f6"
              height={200}
              layout="vertical"
            />
          ) : (
            <EmptyState message="No keywords analyzed yet" />
          )}
        </div>

        {/* Top Domains */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Domains</h2>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-slate-500 animate-spin" />
            </div>
          ) : domainBarData.length > 0 ? (
            <BarChart
              data={domainBarData}
              dataKey="searches"
              xAxisKey="name"
              color="#22c55e"
              height={200}
              layout="vertical"
            />
          ) : (
            <EmptyState message="No domains analyzed yet" />
          )}
        </div>
      </div>

      {/* Recent Searches & Top Items */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Searches */}
        <div className="md:col-span-2 rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Searches</h2>
            <Link
              href="/history"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentSearches.length > 0 ? (
            <div className="space-y-3">
              {recentSearches.slice(0, 5).map((search) => {
                const Icon = TYPE_ICONS[search.inputType] || Hash;
                return (
                  <Link
                    key={search.id}
                    href={`/results?q=${encodeURIComponent(search.inputValue)}&type=${search.inputType}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: TYPE_COLORS[search.inputType] + "20" }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: TYPE_COLORS[search.inputType] }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[300px]">
                          {search.inputValue}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(search.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No recent searches</p>
              <Link
                href="/"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Start Searching
              </Link>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Tips</h2>
          <div className="space-y-4">
            <TipCard
              title="Smart Input Detection"
              description="Just type anything - we'll automatically detect if it's a keyword, URL, business name, or phone number."
            />
            <TipCard
              title="Track Changes"
              description="Save searches to track keyword rankings and domain metrics over time."
            />
            <TipCard
              title="Set Alerts"
              description="Get notified when there are significant changes to rankings or traffic."
            />
          </div>
        </div>
      </div>

      {/* Top Items Tables */}
      {(analytics?.topKeywords.length || analytics?.topDomains.length) && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Top Keywords Table */}
          {analytics?.topKeywords && analytics.topKeywords.length > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Keyword Details
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                        Keyword
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                        Searches
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                        Avg Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topKeywords.map((kw, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30"
                      >
                        <td className="py-2 px-3 text-sm text-white">
                          <Link
                            href={`/results?q=${encodeURIComponent(kw.keyword)}&type=keyword`}
                            className="hover:text-blue-400"
                          >
                            {kw.keyword}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-sm text-slate-300 text-right">
                          {kw.searchCount}
                        </td>
                        <td className="py-2 px-3 text-sm text-slate-300 text-right">
                          {kw.avgSearchVolume?.toLocaleString() || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Domains Table */}
          {analytics?.topDomains && analytics.topDomains.length > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Domain Details
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                        Domain
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                        Searches
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                        Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topDomains.map((d, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30"
                      >
                        <td className="py-2 px-3 text-sm text-white">
                          <Link
                            href={`/results?q=${encodeURIComponent("https://" + d.domain)}&type=url`}
                            className="hover:text-blue-400"
                          >
                            {d.domain}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-sm text-slate-300 text-right">
                          {d.searchCount}
                        </td>
                        <td className="py-2 px-3 text-sm text-slate-300 text-right">
                          {d.latestRank?.toLocaleString() || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coming Soon Features */}
      <div className="mt-8 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Coming Soon</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ComingSoonCard
            title="Bulk Search"
            description="Upload CSV files to analyze multiple keywords or domains at once"
          />
          <ComingSoonCard
            title="Scheduled Monitoring"
            description="Automatically track changes to your keywords and competitors"
          />
          <ComingSoonCard
            title="API Access"
            description="Integrate SEO data directly into your applications"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Search;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-700 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      )}
    </div>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-700/30">
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}

function ComingSoonCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
