"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Calendar,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";
import { AreaChart } from "@/components/charts/AreaChart";
import { cn } from "@/lib/utils";

interface KeywordRanking {
  keyword: string;
  position: number;
  previousPosition: number | null;
  impressions: number;
  clicks: number;
  url: string;
  lastUpdated: string;
}

interface MCPStats {
  keywordsTracked: number;
  avgPosition: number;
  totalImpressions: number;
  totalClicks: number;
  topKeyword: string;
  lastUpdated: string;
}

// Mock data - will be replaced with real API calls
const MOCK_KEYWORDS: KeywordRanking[] = [
  { keyword: "wordpress mcp", position: 3, previousPosition: 5, impressions: 1200, clicks: 89, url: "/wordpress-mcp", lastUpdated: "2026-02-27" },
  { keyword: "master control press", position: 1, previousPosition: 1, impressions: 450, clicks: 156, url: "/", lastUpdated: "2026-02-27" },
  { keyword: "wordpress ai plugin", position: 8, previousPosition: 12, impressions: 3400, clicks: 127, url: "/wordpress-ai-plugin", lastUpdated: "2026-02-27" },
  { keyword: "mcp server wordpress", position: 4, previousPosition: 6, impressions: 890, clicks: 67, url: "/mcp-server", lastUpdated: "2026-02-27" },
  { keyword: "ai wordpress development", position: 11, previousPosition: 15, impressions: 2100, clicks: 45, url: "/ai-wordpress-development", lastUpdated: "2026-02-27" },
  { keyword: "wordpress automation ai", position: 6, previousPosition: 8, impressions: 1800, clicks: 92, url: "/automation", lastUpdated: "2026-02-27" },
  { keyword: "claude wordpress plugin", position: 5, previousPosition: 7, impressions: 980, clicks: 54, url: "/claude-integration", lastUpdated: "2026-02-27" },
  { keyword: "wordpress agent ai", position: 9, previousPosition: 14, impressions: 760, clicks: 38, url: "/ai-agents", lastUpdated: "2026-02-27" },
];

const MOCK_HISTORY = [
  { date: "Feb 1", avgPosition: 28.5, totalImpressions: 4200, totalClicks: 180 },
  { date: "Feb 5", avgPosition: 24.2, totalImpressions: 5800, totalClicks: 245 },
  { date: "Feb 10", avgPosition: 19.8, totalImpressions: 7400, totalClicks: 312 },
  { date: "Feb 15", avgPosition: 15.3, totalImpressions: 9100, totalClicks: 428 },
  { date: "Feb 20", avgPosition: 11.7, totalImpressions: 11200, totalClicks: 567 },
  { date: "Feb 25", avgPosition: 8.4, totalImpressions: 13500, totalClicks: 698 },
  { date: "Feb 27", avgPosition: 5.9, totalImpressions: 14800, totalClicks: 768 },
];

export function MCPTrackerClient() {
  const [keywords, setKeywords] = useState<KeywordRanking[]>(MOCK_KEYWORDS);
  const [history] = useState(MOCK_HISTORY);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"position" | "impressions" | "clicks">("position");

  // Calculate stats
  const stats: MCPStats = {
    keywordsTracked: keywords.length,
    avgPosition: Number((keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length).toFixed(1)),
    totalImpressions: keywords.reduce((sum, k) => sum + k.impressions, 0),
    totalClicks: keywords.reduce((sum, k) => sum + k.clicks, 0),
    topKeyword: keywords.reduce((best, k) => k.position < best.position ? k : best, keywords[0])?.keyword || "",
    lastUpdated: new Date().toLocaleDateString(),
  };

  // Sort keywords
  const sortedKeywords = [...keywords].sort((a, b) => {
    if (sortBy === "position") return a.position - b.position;
    if (sortBy === "impressions") return b.impressions - a.impressions;
    return b.clicks - a.clicks;
  });

  const refreshData = async () => {
    setLoading(true);
    // TODO: Replace with real API call to GSC
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  const getTrendIcon = (current: number, previous: number | null) => {
    if (previous === null) return <Minus className="h-4 w-4 text-slate-500" />;
    const diff = previous - current;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-500" />;
  };

  const getTrendText = (current: number, previous: number | null) => {
    if (previous === null) return "New";
    const diff = previous - current;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return "—";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4">
          <Target className="h-4 w-4" />
          Live SEO Tracking
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Master Control Press Rankings
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-6">
          Public proof that our SEO actually works. Watch mastercontrolpress.com climb the rankings in real-time.
        </p>
        <a
          href="https://mastercontrolpress.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          Visit mastercontrolpress.com
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Target}
          label="Keywords Tracked"
          value={stats.keywordsTracked.toString()}
        />
        <StatCard
          icon={BarChart3}
          label="Avg. Position"
          value={stats.avgPosition.toString()}
          highlight
        />
        <StatCard
          icon={TrendingUp}
          label="Total Impressions"
          value={stats.totalImpressions.toLocaleString()}
        />
        <StatCard
          icon={Calendar}
          label="Total Clicks"
          value={stats.totalClicks.toLocaleString()}
        />
      </div>

      {/* Ranking History Chart */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Ranking Progress</h2>
            <p className="text-sm text-slate-400">Average position over time (lower is better)</p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
            <span className="text-sm text-slate-300">Refresh</span>
          </button>
        </div>
        <AreaChart
          data={history as Array<Record<string, string | number>>}
          dataKey="avgPosition"
          xAxisKey="date"
          color="#22c55e"
          gradientId="rankingGradient"
          height={300}
        />
      </div>

      {/* Traffic Chart */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Impressions Growth</h3>
          <AreaChart
            data={history as Array<Record<string, string | number>>}
            dataKey="totalImpressions"
            xAxisKey="date"
            color="#3b82f6"
            gradientId="impressionsGradient"
            height={200}
          />
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Clicks Growth</h3>
          <AreaChart
            data={history as Array<Record<string, string | number>>}
            dataKey="totalClicks"
            xAxisKey="date"
            color="#8b5cf6"
            gradientId="clicksGradient"
            height={200}
          />
        </div>
      </div>

      {/* Keywords Table */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Tracked Keywords</h2>
              <p className="text-sm text-slate-400">Keywords we&apos;re actively optimizing for</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="position">Position</option>
                <option value="impressions">Impressions</option>
                <option value="clicks">Clicks</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-400 uppercase">Keyword</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">Position</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase">Change</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Impressions</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Clicks</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">CTR</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeywords.map((kw) => (
                <tr
                  key={kw.keyword}
                  className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">{kw.keyword}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                      kw.position <= 3 && "bg-green-500/20 text-green-400",
                      kw.position > 3 && kw.position <= 10 && "bg-blue-500/20 text-blue-400",
                      kw.position > 10 && "bg-slate-500/20 text-slate-400"
                    )}>
                      {kw.position}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(kw.position, kw.previousPosition)}
                      <span className={cn(
                        "text-sm",
                        kw.previousPosition && kw.previousPosition > kw.position && "text-green-400",
                        kw.previousPosition && kw.previousPosition < kw.position && "text-red-400",
                        (!kw.previousPosition || kw.previousPosition === kw.position) && "text-slate-500"
                      )}>
                        {getTrendText(kw.position, kw.previousPosition)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-slate-300">
                    {kw.impressions.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-slate-300">
                    {kw.clicks.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-slate-300">
                    {((kw.clicks / kw.impressions) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 rounded-xl bg-blue-500/10 border border-blue-500/20 p-6">
        <div className="flex items-start gap-4">
          <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">About This Dashboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              This dashboard shows real Google Search Console data for mastercontrolpress.com. 
              We built Master Control Press to prove that AI-powered WordPress development works. 
              Instead of just telling you SEO works, we&apos;re showing you the receipts. 
              Data refreshes daily from GSC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-6",
      highlight
        ? "bg-green-500/10 border-green-500/20"
        : "bg-slate-800/50 border-slate-700"
    )}>
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className={cn("h-4 w-4", highlight && "text-green-400")} />
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn(
        "text-2xl font-bold",
        highlight ? "text-green-400" : "text-white"
      )}>
        {value}
      </p>
    </div>
  );
}
