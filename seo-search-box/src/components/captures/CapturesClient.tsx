"use client";

import { useState, useEffect } from "react";
import {
  FileSearch,
  Globe,
  BarChart3,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SEOIssue {
  type: "error" | "warning" | "info";
  message: string;
}

interface PageCapture {
  id: string;
  url: string;
  domain: string;
  title: string;
  wordCount: number;
  seoScore: number;
  seoGrade: string;
  issues: SEOIssue[];
  capturedAt: string;
}

interface CaptureStats {
  totalCaptures: number;
  avgScore: number;
  topDomains: { domain: string; count: number }[];
  recentCaptures: number;
}

// Mock data - will be replaced with API calls to api.seobandwagon.dev/v1/captures
const MOCK_CAPTURES: PageCapture[] = [
  {
    id: "1",
    url: "https://example.com/blog/seo-tips",
    domain: "example.com",
    title: "10 SEO Tips for 2026 - Example Blog",
    wordCount: 1847,
    seoScore: 85,
    seoGrade: "B+",
    issues: [
      { type: "warning", message: "Meta description is 168 characters (recommended: 150-160)" },
      { type: "info", message: "Consider adding more internal links" },
    ],
    capturedAt: "2026-02-27T19:30:00Z",
  },
  {
    id: "2",
    url: "https://techsite.io/products/widget",
    domain: "techsite.io",
    title: "Widget Pro - Premium Features",
    wordCount: 923,
    seoScore: 72,
    seoGrade: "C+",
    issues: [
      { type: "error", message: "Missing H1 tag" },
      { type: "warning", message: "Low word count for product page" },
      { type: "warning", message: "No schema markup detected" },
    ],
    capturedAt: "2026-02-27T18:45:00Z",
  },
  {
    id: "3",
    url: "https://mastercontrolpress.com/wordpress-mcp",
    domain: "mastercontrolpress.com",
    title: "WordPress MCP - AI-Powered Development",
    wordCount: 2156,
    seoScore: 92,
    seoGrade: "A",
    issues: [
      { type: "info", message: "Consider adding FAQ schema" },
    ],
    capturedAt: "2026-02-27T17:20:00Z",
  },
  {
    id: "4",
    url: "https://localshop.example/about",
    domain: "localshop.example",
    title: "About Us - Local Shop",
    wordCount: 456,
    seoScore: 58,
    seoGrade: "D+",
    issues: [
      { type: "error", message: "Title tag too short (18 characters)" },
      { type: "error", message: "Missing meta description" },
      { type: "warning", message: "No Open Graph tags" },
      { type: "warning", message: "Images missing alt text (3 of 5)" },
    ],
    capturedAt: "2026-02-27T16:00:00Z",
  },
  {
    id: "5",
    url: "https://blog.startup.co/launch-announcement",
    domain: "blog.startup.co",
    title: "We Just Launched! Here is What is Next",
    wordCount: 1234,
    seoScore: 78,
    seoGrade: "B",
    issues: [
      { type: "warning", message: "Multiple H1 tags detected (2)" },
      { type: "info", message: "Add structured data for article" },
    ],
    capturedAt: "2026-02-27T14:30:00Z",
  },
];

export function CapturesClient() {
  const [captures, setCaptures] = useState<PageCapture[]>(MOCK_CAPTURES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculate stats
  const stats: CaptureStats = {
    totalCaptures: captures.length,
    avgScore: Math.round(captures.reduce((sum, c) => sum + c.seoScore, 0) / captures.length),
    topDomains: Object.entries(
      captures.reduce((acc, c) => {
        acc[c.domain] = (acc[c.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    recentCaptures: captures.filter(
      (c) => new Date(c.capturedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
  };

  // Filter captures
  const filteredCaptures = captures.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = !domainFilter || c.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API call
      // const res = await fetch("https://api.seobandwagon.dev/v1/captures");
      // const data = await res.json();
      // setCaptures(data.captures);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.error("Failed to fetch captures:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-400 bg-green-500/20";
    if (grade.startsWith("B")) return "text-blue-400 bg-blue-500/20";
    if (grade.startsWith("C")) return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };

  const getIssueIcon = (type: SEOIssue["type"]) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  const uniqueDomains = Array.from(new Set(captures.map((c) => c.domain)));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Page Captures</h1>
          <p className="text-slate-400">
            SEO analysis data from the browser extension
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span>Sync</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileSearch} label="Total Captures" value={stats.totalCaptures.toString()} />
        <StatCard icon={BarChart3} label="Avg. Score" value={`${stats.avgScore}/100`} />
        <StatCard icon={Globe} label="Unique Domains" value={uniqueDomains.length.toString()} />
        <StatCard icon={Clock} label="Last 24h" value={stats.recentCaptures.toString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by URL, title, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={domainFilter || ""}
            onChange={(e) => setDomainFilter(e.target.value || null)}
            className="pl-10 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:border-blue-500"
          >
            <option value="">All Domains</option>
            {uniqueDomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Captures List */}
      <div className="space-y-4">
        {filteredCaptures.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700">
            <FileSearch className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-slate-400">No captures found</p>
            <p className="text-sm text-slate-500 mt-1">
              Install the browser extension to start capturing pages
            </p>
          </div>
        ) : (
          filteredCaptures.map((capture) => (
            <div
              key={capture.id}
              className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden"
            >
              {/* Main Row */}
              <div
                className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpandedId(expandedId === capture.id ? null : capture.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Grade Badge */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg",
                        getGradeColor(capture.seoGrade)
                      )}
                    >
                      {capture.seoGrade}
                    </div>

                    {/* Title & URL */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{capture.title}</h3>
                      <p className="text-sm text-slate-500 truncate">{capture.url}</p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-slate-400">
                      <span className="text-white font-medium">{capture.wordCount.toLocaleString()}</span> words
                    </div>
                    <div className="text-slate-400">
                      Score: <span className="text-white font-medium">{capture.seoScore}</span>
                    </div>
                    <div className="text-slate-500">
                      {new Date(capture.capturedAt).toLocaleDateString()}
                    </div>
                    {expandedId === capture.id ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Mobile Meta */}
                <div className="flex md:hidden items-center gap-4 mt-3 text-sm text-slate-400">
                  <span>{capture.wordCount} words</span>
                  <span>•</span>
                  <span>Score: {capture.seoScore}</span>
                  <span>•</span>
                  <span>{new Date(capture.capturedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === capture.id && (
                <div className="border-t border-slate-700 p-4 bg-slate-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-slate-300">Issues Found ({capture.issues.length})</h4>
                    <a
                      href={capture.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Visit Page
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {capture.issues.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      No issues detected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {capture.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          {getIssueIcon(issue.type)}
                          <span className="text-slate-300">{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Extension CTA */}
      <div className="mt-8 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Get the Browser Extension
            </h3>
            <p className="text-sm text-slate-400">
              Capture SEO data from any page with one click. Free and open source.
            </p>
          </div>
          <a
            href="https://github.com/seo-bandwagon/seo-bw-extension"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <Globe className="h-4 w-4" />
            Install Extension
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileSearch;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
