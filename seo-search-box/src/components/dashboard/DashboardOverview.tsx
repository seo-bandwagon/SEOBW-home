"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Search,
  Hash,
  Globe,
  Bookmark,
  Clock,
  ArrowRight,
  Phone,
  Building2,
  RefreshCw,
  AlertCircle,
  LogOut,
  ExternalLink,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { BarChart } from "@/components/charts/BarChart";
import { PieChart } from "@/components/charts/PieChart";

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

interface GscStatus {
  connected: boolean;
  email?: string;
  gsc_connected?: boolean;
  ga4_connected?: boolean;
}

interface DashboardOverviewProps {
  user: {
    name?: string;
    email?: string;
    image?: string;
  };
  recentSearches: RecentSearch[];
  savedSearchCount: number;
}

const TYPE_COLORS: Record<string, string> = {
  keyword: "#3b82f6",
  url: "#22c55e",
  phone: "#f59e0b",
  business: "#8b5cf6",
};

const TYPE_ICONS: Record<string, typeof Hash> = {
  keyword: Hash,
  url: Globe,
  phone: Phone,
  business: Building2,
};

export function DashboardOverview({
  user,
  recentSearches,
  savedSearchCount,
}: DashboardOverviewProps) {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [gscStatus, setGscStatus] = useState<GscStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, gscRes] = await Promise.allSettled([
        fetch("/api/analytics?type=overview").then((r) =>
          r.ok ? r.json() : null
        ),
        user.email
          ? fetch(
              `https://api.seobandwagon.dev/auth/status?email=${encodeURIComponent(user.email)}`
            ).then((r) => (r.ok ? r.json() : { connected: false }))
          : Promise.resolve({ connected: false }),
      ]);

      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value);
      if (gscRes.status === "fulfilled") setGscStatus(gscRes.value);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const totalSearches =
    analytics?.stats.reduce((sum, s) => sum + s.count, 0) || 0;
  const keywordCount =
    analytics?.stats.find((s) => s.inputType === "keyword")?.count || 0;
  const domainCount =
    analytics?.stats.find((s) => s.inputType === "url")?.count || 0;

  const pieData =
    analytics?.stats.map((s) => ({
      name: s.inputType.charAt(0).toUpperCase() + s.inputType.slice(1),
      value: s.count,
      color: TYPE_COLORS[s.inputType] || "#64748b",
    })) || [];

  const keywordBarData =
    analytics?.topKeywords.map((k) => ({
      name: k.keyword.length > 15 ? k.keyword.slice(0, 15) + "..." : k.keyword,
      fullName: k.keyword,
      searches: k.searchCount,
      volume: k.avgSearchVolume || 0,
    })) || [];

  const domainBarData =
    analytics?.topDomains.map((d) => ({
      name: d.domain.length > 20 ? d.domain.slice(0, 20) + "..." : d.domain,
      fullName: d.domain,
      searches: d.searchCount,
      rank: d.latestRank || 0,
    })) || [];

  const connectGsc = () => {
    const redirect = encodeURIComponent(window.location.origin + "/dashboard");
    window.location.href = `https://api.seobandwagon.dev/auth/google?redirect=${redirect}`;
  };

  return (
    <div className="max-w-6xl">
      {/* Account Card */}
      <div className="flex items-center justify-between mb-8 p-6 rounded-xl bg-[#000022] border-2 border-pink/30">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="h-14 w-14 rounded-full border-2 border-pink"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink/20 border-2 border-pink">
              <User className="h-7 w-7 text-pink" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">
              {user.name || "User"}
            </h1>
            <p className="text-sm text-[#F5F5F5]/50">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-pink/30 text-pink hover:bg-pink/10 transition-colors bg-transparent cursor-pointer text-sm"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Connected Services */}
      <div className="mb-8 p-6 rounded-xl bg-[#000022] border-2 border-pink/30">
        <h2 className="text-lg font-heading text-[#F5F5F5] tracking-wide mb-4">
          Connected Services
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* GSC */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">
                  Google Search Console
                </p>
                <p className="text-xs text-[#F5F5F5]/40">
                  {gscStatus?.connected
                    ? `Connected as ${gscStatus.email}`
                    : "Not connected"}
                </p>
              </div>
            </div>
            {loading ? (
              <RefreshCw className="h-4 w-4 text-[#F5F5F5]/30 animate-spin" />
            ) : gscStatus?.connected ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <button
                onClick={connectGsc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors border-none cursor-pointer"
              >
                Connect
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* GA4 */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <Globe className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">
                  Google Analytics 4
                </p>
                <p className="text-xs text-[#F5F5F5]/40">
                  {gscStatus?.ga4_connected ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            {loading ? (
              <RefreshCw className="h-4 w-4 text-[#F5F5F5]/30 animate-spin" />
            ) : gscStatus?.ga4_connected ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-[#F5F5F5]/20" />
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Search} label="Total Searches" value={totalSearches} loading={loading} />
        <StatCard icon={Hash} label="Keywords" value={keywordCount} loading={loading} />
        <StatCard icon={Globe} label="Domains" value={domainCount} loading={loading} />
        <StatCard icon={Bookmark} label="Saved" value={savedSearchCount} loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Search Types
          </h2>
          {loading ? (
            <LoadingBox />
          ) : pieData.length > 0 ? (
            <PieChart data={pieData} height={200} innerRadius={50} outerRadius={70} />
          ) : (
            <EmptyBox message="No search data yet" />
          )}
        </div>

        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Top Keywords
          </h2>
          {loading ? (
            <LoadingBox />
          ) : keywordBarData.length > 0 ? (
            <BarChart
              data={keywordBarData}
              dataKey="searches"
              xAxisKey="name"
              color="#FF1493"
              height={200}
              layout="vertical"
            />
          ) : (
            <EmptyBox message="No keywords analyzed yet" />
          )}
        </div>

        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Top Domains
          </h2>
          {loading ? (
            <LoadingBox />
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
            <EmptyBox message="No domains analyzed yet" />
          )}
        </div>
      </div>

      {/* Recent Searches */}
      <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide">
            Recent Searches
          </h2>
          <Link
            href="/history"
            className="text-sm text-pink hover:text-pink/80 flex items-center gap-1 no-underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentSearches.length > 0 ? (
          <div className="space-y-2">
            {recentSearches.slice(0, 5).map((search) => {
              const Icon = TYPE_ICONS[search.inputType] || Hash;
              return (
                <Link
                  key={search.id}
                  href={`/results/${search.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 transition-colors no-underline"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: TYPE_COLORS[search.inputType] + "20",
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: TYPE_COLORS[search.inputType] }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#F5F5F5] truncate max-w-[300px]">
                        {search.inputValue}
                      </p>
                      <p className="text-xs text-[#F5F5F5]/30">
                        {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#F5F5F5]/20" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-[#F5F5F5]/20 mb-3" />
            <p className="text-[#F5F5F5]/40 text-sm">No recent searches</p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-pink text-white hover:bg-pink/80 transition-colors no-underline text-sm"
            >
              Start Searching
            </Link>
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
  loading,
}: {
  icon: typeof Search;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-4">
      <div className="flex items-center gap-2 text-[#F5F5F5]/40 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-[#F5F5F5]/10 rounded animate-pulse" />
      ) : (
        <p className="text-xl font-bold text-[#F5F5F5]">
          {value.toLocaleString()}
        </p>
      )}
    </div>
  );
}

function LoadingBox() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <RefreshCw className="h-6 w-6 text-[#F5F5F5]/20 animate-spin" />
    </div>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-[#F5F5F5]/30 text-sm">{message}</p>
    </div>
  );
}
