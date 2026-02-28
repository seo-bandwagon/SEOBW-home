"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  HeartPulse,
  Gauge,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { BarChart } from "@/components/charts/BarChart";

interface Analysis {
  id: string;
  url: string;
  domain: string;
  score: number;
  word_count: number;
  reading_ease: number;
  core_web_vitals: {
    lcp?: number;
    cls?: number;
    inp?: number;
    fcp?: number;
    ttfb?: number;
  } | null;
  structured_data: { types?: string[] } | null;
  text_to_html_ratio: { ratio?: number } | null;
  mixed_content: { issues?: number } | null;
  created_at: string;
}

interface Stats {
  totalAnalyses: number;
  avgScore: number;
  avgWordCount: number;
  domains: string[];
}

type CwvRating = "good" | "needs-improvement" | "poor";

const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
};

function rateCwv(metric: keyof typeof CWV_THRESHOLDS, value: number): CwvRating {
  const t = CWV_THRESHOLDS[metric];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

const RATING_COLORS: Record<CwvRating, string> = {
  good: "text-green-400",
  "needs-improvement": "text-yellow-400",
  poor: "text-red-400",
};

const RATING_BG: Record<CwvRating, string> = {
  good: "bg-green-400/20",
  "needs-improvement": "bg-yellow-400/20",
  poor: "bg-red-400/20",
};

const RATING_ICONS: Record<CwvRating, typeof CheckCircle2> = {
  good: CheckCircle2,
  "needs-improvement": MinusCircle,
  poor: XCircle,
};

export function SiteHealthClient() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [domainFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const domainParam = domainFilter
        ? `?domain=${encodeURIComponent(domainFilter)}`
        : "";

      const [dashRes, statsRes] = await Promise.allSettled([
        fetch(
          `https://api.seobandwagon.dev/api/extension/dashboard${domainParam}`
        ).then((r) => (r.ok ? r.json() : { analyses: [] })),
        fetch(`https://api.seobandwagon.dev/api/extension/stats`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      if (dashRes.status === "fulfilled") {
        const data = dashRes.value;
        setAnalyses(data.analyses || []);
        // Extract unique domains
        const uniqueDomains = Array.from(
          new Set(
            (data.analyses || []).map((a: Analysis) => a.domain)
          )
        ) as string[];
        setDomains(uniqueDomains);
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  // Calculate CWV averages
  const cwvAnalyses = analyses.filter((a) => a.core_web_vitals);
  const avgCwv = {
    lcp: cwvAnalyses.reduce((s, a) => s + (a.core_web_vitals?.lcp || 0), 0) / (cwvAnalyses.length || 1),
    cls: cwvAnalyses.reduce((s, a) => s + (a.core_web_vitals?.cls || 0), 0) / (cwvAnalyses.length || 1),
    inp: cwvAnalyses.reduce((s, a) => s + (a.core_web_vitals?.inp || 0), 0) / (cwvAnalyses.length || 1),
    fcp: cwvAnalyses.reduce((s, a) => s + (a.core_web_vitals?.fcp || 0), 0) / (cwvAnalyses.length || 1),
    ttfb: cwvAnalyses.reduce((s, a) => s + (a.core_web_vitals?.ttfb || 0), 0) / (cwvAnalyses.length || 1),
  };

  // Calculate overall health score
  const avgScore =
    analyses.length > 0
      ? analyses.reduce((s, a) => s + (a.score || 0), 0) / analyses.length
      : 0;

  // Issues
  const issues = {
    mixedContent: analyses.filter(
      (a) => a.mixed_content && (a.mixed_content.issues || 0) > 0
    ).length,
    missingSchema: analyses.filter(
      (a) =>
        !a.structured_data ||
        !a.structured_data.types ||
        a.structured_data.types.length === 0
    ).length,
    poorCwv: cwvAnalyses.filter(
      (a) =>
        (a.core_web_vitals?.lcp || 0) > CWV_THRESHOLDS.lcp.poor ||
        (a.core_web_vitals?.cls || 0) > CWV_THRESHOLDS.cls.poor
    ).length,
    lowReadability: analyses.filter((a) => a.reading_ease < 30).length,
  };
  const totalIssues =
    issues.mixedContent + issues.missingSchema + issues.poorCwv + issues.lowReadability;

  // Readability distribution
  const readabilityDist = [
    {
      name: "Very Easy (80+)",
      count: analyses.filter((a) => a.reading_ease >= 80).length,
    },
    {
      name: "Easy (60-79)",
      count: analyses.filter((a) => a.reading_ease >= 60 && a.reading_ease < 80).length,
    },
    {
      name: "Standard (40-59)",
      count: analyses.filter((a) => a.reading_ease >= 40 && a.reading_ease < 60).length,
    },
    {
      name: "Difficult (<40)",
      count: analyses.filter((a) => a.reading_ease < 40).length,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-pink animate-spin" />
      </div>
    );
  }

  if (analyses.length === 0 && !domainFilter) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink/20 mx-auto mb-6">
          <HeartPulse className="h-8 w-8 text-pink" />
        </div>
        <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide mb-3">
          No Site Health Data Yet
        </h1>
        <p className="text-[#F5F5F5]/50 text-sm mb-6 max-w-sm mx-auto">
          Install the SEO Bandwagon Chrome Extension and analyze some pages to
          see your site health data here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">
            Site Health
          </h1>
          <p className="text-sm text-[#F5F5F5]/40 mt-1">
            {analyses.length} pages analyzed across {domains.length} domains
          </p>
        </div>

        {/* Domain Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#F5F5F5]/30" />
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 rounded-lg px-3 py-1.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-pink/50"
          >
            <option value="">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Health Score + CWV Summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Overall Score */}
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Overall Health Score
          </h2>
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#F5F5F5"
                  strokeOpacity="0.1"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={avgScore >= 70 ? "#22c55e" : avgScore >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(avgScore / 100) * 314} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-[#F5F5F5]">
                  {Math.round(avgScore)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-[#F5F5F5]">
                {analyses.length}
              </p>
              <p className="text-xs text-[#F5F5F5]/40">Pages</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#F5F5F5]">
                {Math.round(
                  analyses.reduce((s, a) => s + a.word_count, 0) /
                    (analyses.length || 1)
                )}
              </p>
              <p className="text-xs text-[#F5F5F5]/40">Avg Words</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#F5F5F5]">
                {totalIssues}
              </p>
              <p className="text-xs text-[#F5F5F5]/40">Issues</p>
            </div>
          </div>
        </div>

        {/* CWV Summary */}
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Core Web Vitals
          </h2>
          {cwvAnalyses.length > 0 ? (
            <div className="space-y-3">
              <CwvRow label="LCP" value={`${(avgCwv.lcp / 1000).toFixed(2)}s`} rating={rateCwv("lcp", avgCwv.lcp)} />
              <CwvRow label="CLS" value={avgCwv.cls.toFixed(3)} rating={rateCwv("cls", avgCwv.cls)} />
              <CwvRow label="INP" value={`${Math.round(avgCwv.inp)}ms`} rating={rateCwv("inp", avgCwv.inp)} />
              <CwvRow label="FCP" value={`${(avgCwv.fcp / 1000).toFixed(2)}s`} rating={rateCwv("fcp", avgCwv.fcp)} />
              <CwvRow label="TTFB" value={`${Math.round(avgCwv.ttfb)}ms`} rating={rateCwv("ttfb", avgCwv.ttfb)} />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[#F5F5F5]/30 text-sm">
                No CWV data collected yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Issues + Readability */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Issues */}
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Issues Found
          </h2>
          <div className="space-y-3">
            <IssueRow
              label="Mixed Content (HTTP/HTTPS)"
              count={issues.mixedContent}
              total={analyses.length}
            />
            <IssueRow
              label="Missing Structured Data"
              count={issues.missingSchema}
              total={analyses.length}
            />
            <IssueRow
              label="Poor Core Web Vitals"
              count={issues.poorCwv}
              total={cwvAnalyses.length}
            />
            <IssueRow
              label="Low Readability (<30)"
              count={issues.lowReadability}
              total={analyses.length}
            />
          </div>
        </div>

        {/* Readability Distribution */}
        <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
          <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
            Readability Distribution
          </h2>
          {analyses.length > 0 ? (
            <BarChart
              data={readabilityDist}
              dataKey="count"
              xAxisKey="name"
              color="#FF1493"
              height={200}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[#F5F5F5]/30 text-sm">No data</p>
            </div>
          )}
        </div>
      </div>

      {/* Analyzed Pages Table */}
      <div className="rounded-xl bg-[#000022] border-2 border-pink/30 p-6">
        <h2 className="text-base font-heading text-[#F5F5F5] tracking-wide mb-4">
          Analyzed Pages
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pink/20">
                <th className="text-left py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  URL
                </th>
                <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  Score
                </th>
                <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  Words
                </th>
                <th className="text-right py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  Read.
                </th>
                <th className="text-center py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  CWV
                </th>
                <th className="text-center py-2 px-2 text-xs font-medium text-[#F5F5F5]/40 uppercase">
                  Schema
                </th>
              </tr>
            </thead>
            <tbody>
              {analyses.slice(0, 20).map((a) => {
                const hasCwv = a.core_web_vitals && a.core_web_vitals.lcp;
                const cwvOk =
                  hasCwv &&
                  (a.core_web_vitals?.lcp || 0) <= CWV_THRESHOLDS.lcp.good &&
                  (a.core_web_vitals?.cls || 0) <= CWV_THRESHOLDS.cls.good;
                const hasSchema =
                  a.structured_data?.types && a.structured_data.types.length > 0;

                return (
                  <tr
                    key={a.id}
                    className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5"
                  >
                    <td className="py-2 px-2 text-sm text-[#F5F5F5] truncate max-w-[250px]">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-pink transition-colors no-underline text-[#F5F5F5]"
                      >
                        {a.url.replace(/^https?:\/\//, "").slice(0, 50)}
                        {a.url.replace(/^https?:\/\//, "").length > 50 ? "..." : ""}
                      </a>
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      <span
                        className={
                          a.score >= 70
                            ? "text-green-400"
                            : a.score >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {a.score}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-sm text-[#F5F5F5]/70 text-right">
                      {a.word_count.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      <span
                        className={
                          a.reading_ease >= 60
                            ? "text-green-400"
                            : a.reading_ease >= 30
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {Math.round(a.reading_ease)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {hasCwv ? (
                        cwvOk ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mx-auto" />
                        )
                      ) : (
                        <MinusCircle className="h-4 w-4 text-[#F5F5F5]/20 mx-auto" />
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {hasSchema ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[#F5F5F5]/20 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {analyses.length > 20 && (
          <p className="text-xs text-[#F5F5F5]/30 mt-3 text-center">
            Showing 20 of {analyses.length} pages
          </p>
        )}
      </div>
    </div>
  );
}

function CwvRow({
  label,
  value,
  rating,
}: {
  label: string;
  value: string;
  rating: CwvRating;
}) {
  const Icon = RATING_ICONS[rating];
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F5]/5">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${RATING_BG[rating]}`}>
          <Icon className={`h-4 w-4 ${RATING_COLORS[rating]}`} />
        </div>
        <span className="text-sm text-[#F5F5F5]">{label}</span>
      </div>
      <span className={`text-sm font-mono font-medium ${RATING_COLORS[rating]}`}>
        {value}
      </span>
    </div>
  );
}

function IssueRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F5F5]/5">
      <span className="text-sm text-[#F5F5F5]">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium ${
            count === 0 ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {count}
        </span>
        <span className="text-xs text-[#F5F5F5]/30">/ {total}</span>
      </div>
    </div>
  );
}
