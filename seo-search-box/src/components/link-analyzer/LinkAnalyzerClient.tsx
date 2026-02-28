"use client";

import { useState } from "react";
import {
  Link2,
  ExternalLink,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Globe,
  Hash,
  ArrowRight,
  LinkIcon,
} from "lucide-react";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { cn } from "@/lib/utils";

interface LinkData {
  href: string;
  text: string;
  isExternal: boolean;
  isNofollow: boolean;
  domain?: string;
}

interface AnalysisResult {
  url: string;
  analyzedAt: string;
  totalLinks: number;
  internalLinks: LinkData[];
  externalLinks: LinkData[];
  nofollowCount: number;
  uniqueDomains: string[];
  anchorTextDistribution: { text: string; count: number }[];
}

// Mock analysis function - will be replaced with real API
async function analyzeUrl(url: string): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 2000));

  // Mock data based on URL
  const mockInternalLinks: LinkData[] = [
    { href: "/about", text: "About Us", isExternal: false, isNofollow: false },
    { href: "/services", text: "Our Services", isExternal: false, isNofollow: false },
    { href: "/blog", text: "Blog", isExternal: false, isNofollow: false },
    { href: "/contact", text: "Contact", isExternal: false, isNofollow: false },
    { href: "/pricing", text: "Pricing", isExternal: false, isNofollow: false },
    { href: "/features", text: "Features", isExternal: false, isNofollow: false },
    { href: "/docs", text: "Documentation", isExternal: false, isNofollow: false },
  ];

  const mockExternalLinks: LinkData[] = [
    { href: "https://twitter.com/example", text: "Twitter", isExternal: true, isNofollow: true, domain: "twitter.com" },
    { href: "https://github.com/example", text: "GitHub", isExternal: true, isNofollow: false, domain: "github.com" },
    { href: "https://linkedin.com/company/example", text: "LinkedIn", isExternal: true, isNofollow: true, domain: "linkedin.com" },
    { href: "https://youtube.com/example", text: "YouTube Channel", isExternal: true, isNofollow: false, domain: "youtube.com" },
  ];

  return {
    url,
    analyzedAt: new Date().toISOString(),
    totalLinks: mockInternalLinks.length + mockExternalLinks.length,
    internalLinks: mockInternalLinks,
    externalLinks: mockExternalLinks,
    nofollowCount: mockExternalLinks.filter((l) => l.isNofollow).length,
    uniqueDomains: Array.from(new Set(mockExternalLinks.map((l) => l.domain).filter(Boolean))) as string[],
    anchorTextDistribution: [
      { text: "About Us", count: 3 },
      { text: "Learn More", count: 5 },
      { text: "Click Here", count: 2 },
      { text: "Read More", count: 4 },
      { text: "Get Started", count: 6 },
      { text: "Contact", count: 2 },
    ],
  };
}

export function LinkAnalyzerClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;

    // Validate URL
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeUrl(url);
      setResult(data);
    } catch (err) {
      setError("Failed to analyze URL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const pieData = result
    ? [
        { name: "Internal", value: result.internalLinks.length, color: "#3b82f6" },
        { name: "External", value: result.externalLinks.length, color: "#8b5cf6" },
      ]
    : [];

  const anchorBarData = result
    ? result.anchorTextDistribution.slice(0, 6).map((item) => ({
        name: item.text.length > 12 ? item.text.slice(0, 12) + "..." : item.text,
        fullName: item.text,
        count: item.count,
      }))
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-4">
          <Link2 className="h-4 w-4" />
          Link Analysis Tool
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Link Analyzer
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Analyze internal and external links on any webpage. Understand your link structure and optimize for SEO.
        </p>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter URL to analyze (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-lg"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !url}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                Analyze
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              icon={LinkIcon}
              label="Total Links"
              value={result.totalLinks.toString()}
            />
            <StatCard
              icon={ArrowUpRight}
              label="Internal"
              value={result.internalLinks.length.toString()}
              color="blue"
            />
            <StatCard
              icon={ExternalLink}
              label="External"
              value={result.externalLinks.length.toString()}
              color="purple"
            />
            <StatCard
              icon={Hash}
              label="Nofollow"
              value={result.nofollowCount.toString()}
              color="yellow"
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Link Distribution</h3>
              {pieData.length > 0 && (
                <PieChart data={pieData} height={200} innerRadius={50} outerRadius={70} />
              )}
            </div>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Anchor Text Usage</h3>
              {anchorBarData.length > 0 && (
                <BarChart
                  data={anchorBarData}
                  dataKey="count"
                  xAxisKey="name"
                  color="#8b5cf6"
                  height={200}
                  layout="vertical"
                />
              )}
            </div>
          </div>

          {/* Link Lists */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Internal Links */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-blue-400" />
                  Internal Links ({result.internalLinks.length})
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {result.internalLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30"
                  >
                    <p className="text-white text-sm font-medium">{link.text}</p>
                    <p className="text-slate-500 text-xs truncate">{link.href}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* External Links */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-purple-400" />
                  External Links ({result.externalLinks.length})
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {result.externalLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">{link.text}</p>
                      {link.isNofollow && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                          nofollow
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs truncate">{link.domain}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unique Domains */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              External Domains ({result.uniqueDomains.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.uniqueDomains.map((domain) => (
                <span
                  key={domain}
                  className="px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 text-sm"
                >
                  {domain}
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">SEO Tips</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Use descriptive anchor text instead of generic phrases like &quot;click here&quot;
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Balance internal and external links - both help SEO when used appropriately
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Use nofollow for sponsored or user-generated content links
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Regularly audit for broken links that hurt user experience
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-16">
          <Link2 className="mx-auto h-16 w-16 text-slate-700 mb-4" />
          <p className="text-slate-400 text-lg">
            Enter a URL above to analyze its link structure
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof LinkIcon;
  label: string;
  value: string;
  color?: "blue" | "purple" | "yellow";
}) {
  const colorClasses = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
  };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className={cn("h-4 w-4", color && colorClasses[color])} />
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", color ? colorClasses[color] : "text-white")}>
        {value}
      </p>
    </div>
  );
}
