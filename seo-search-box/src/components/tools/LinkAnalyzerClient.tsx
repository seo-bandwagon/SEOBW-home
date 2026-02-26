"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Link2,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Globe,
  Shield,
  Search,
} from "lucide-react";

interface LinkAnalysisResult {
  url: string;
  domain: string;
  page: {
    internalLinks: number;
    externalLinks: number;
    inboundLinks: number;
    brokenLinks: boolean;
    onpageScore: number | null;
    title: string;
    statusCode: number | null;
    checks: Record<string, boolean>;
  } | null;
  backlinks: {
    totalBacklinks: number;
    referringDomains: number;
    referringIps: number;
    domainRank: number;
    spamScore: number;
    brokenBacklinks: number;
    referringDomainsNofollow: number;
  } | null;
}

export function LinkAnalyzerClient() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkAnalysisResult | null>(null);

  // Pre-populate from query param (from extension)
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      // Auto-analyze if URL came from extension
      analyzeUrl(urlParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyzeUrl(targetUrl?: string) {
    const analyzeTarget = targetUrl || url;
    if (!analyzeTarget.trim()) return;

    // Ensure it has a protocol
    let fullUrl = analyzeTarget.trim();
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      fullUrl = "https://" + fullUrl;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/link-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Search Input */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            analyzeUrl();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL to analyze (e.g., https://example.com/page)"
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
            Analyze
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Page Title */}
          {result.page?.title && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                {result.page.title}
              </h2>
              <p className="text-slate-400 text-sm mt-1">{result.url}</p>
            </div>
          )}

          {/* On-Page Link Stats */}
          {result.page && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-400" />
                On-Page Links
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Internal Links"
                  value={result.page.internalLinks}
                  icon={<Link2 className="w-4 h-4" />}
                  color="blue"
                />
                <StatCard
                  label="External Links"
                  value={result.page.externalLinks}
                  icon={<ExternalLink className="w-4 h-4" />}
                  color="green"
                />
                <StatCard
                  label="Inbound Links"
                  value={result.page.inboundLinks}
                  icon={<ArrowRight className="w-4 h-4" />}
                  color="purple"
                />
                <StatCard
                  label="On-Page Score"
                  value={
                    result.page.onpageScore !== null
                      ? `${result.page.onpageScore.toFixed(1)}%`
                      : "N/A"
                  }
                  icon={
                    result.page.onpageScore && result.page.onpageScore >= 70 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )
                  }
                  color={
                    result.page.onpageScore && result.page.onpageScore >= 70
                      ? "green"
                      : "yellow"
                  }
                />
              </div>

              {/* Status indicators */}
              <div className="mt-4 flex flex-wrap gap-3">
                <StatusBadge
                  label="Broken Links"
                  ok={!result.page.brokenLinks}
                />
                <StatusBadge
                  label={`HTTP ${result.page.statusCode}`}
                  ok={result.page.statusCode === 200}
                />
              </div>
            </div>
          )}

          {/* Backlink Summary */}
          {result.backlinks && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Domain Backlink Profile
                <span className="text-sm font-normal text-slate-400">
                  ({result.domain})
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Backlinks"
                  value={formatNumber(result.backlinks.totalBacklinks)}
                  icon={<Link2 className="w-4 h-4" />}
                  color="blue"
                />
                <StatCard
                  label="Referring Domains"
                  value={formatNumber(result.backlinks.referringDomains)}
                  icon={<Globe className="w-4 h-4" />}
                  color="green"
                />
                <StatCard
                  label="Domain Rank"
                  value={result.backlinks.domainRank}
                  icon={<ArrowRight className="w-4 h-4" />}
                  color="purple"
                />
                <StatCard
                  label="Spam Score"
                  value={result.backlinks.spamScore}
                  icon={<Shield className="w-4 h-4" />}
                  color={result.backlinks.spamScore > 30 ? "red" : "green"}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="text-slate-400">
                  Referring IPs:{" "}
                  <span className="text-white">
                    {formatNumber(result.backlinks.referringIps)}
                  </span>
                </div>
                <div className="text-slate-400">
                  Broken Backlinks:{" "}
                  <span className="text-white">
                    {formatNumber(result.backlinks.brokenBacklinks)}
                  </span>
                </div>
                <div className="text-slate-400">
                  Nofollow Domains:{" "}
                  <span className="text-white">
                    {formatNumber(result.backlinks.referringDomainsNofollow)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center text-slate-400 text-sm">
            Want deeper analysis?{" "}
            <a
              href={`/?q=${encodeURIComponent(result.domain)}`}
              className="text-blue-400 hover:text-blue-300"
            >
              Search this domain on SEO Bandwagon →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    red: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mb-2 ${colorClasses[color] || colorClasses.blue}`}
      >
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
        ok
          ? "bg-green-500/10 text-green-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {ok ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5" />
      )}
      {label}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
