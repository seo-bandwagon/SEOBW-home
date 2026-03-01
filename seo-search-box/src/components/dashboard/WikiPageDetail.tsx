"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Link2,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Globe,
  BarChart3,
} from "lucide-react";
import { AreaChart, BarChart } from "@/components/charts";

interface Snapshot {
  snapshot_date: string;
  snapshot_timestamp: string;
  wayback_url: string;
  external_link_count: number;
  internal_link_count: number;
  external_domains: string[];
  title: string;
  word_count: number;
  h1: string[];
  h2: string[];
  meta_description: string;
  text_preview: string;
}

interface LinkChange {
  from_date: string;
  to_date: string;
  from_timestamp: string;
  to_timestamp: string;
  links_added: Array<{ url: string; text: string; domain: string }>;
  links_removed: Array<{ url: string; text: string; domain: string }>;
  domains_added: string[];
  domains_removed: string[];
  links_added_count: number;
  links_removed_count: number;
  word_count_before: number;
  word_count_after: number;
  h2_before: string[];
  h2_after: string[];
}

interface PageData {
  slug: string;
  url: string;
  title: string;
  wayback_monthly_captures: number;
  wayback_first_capture: string;
  wayback_last_capture: string;
  external_link_count: number;
  keyword_count: number;
}

export function WikiPageDetail({ slug }: { slug: string }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [changes, setChanges] = useState<LinkChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChange, setExpandedChange] = useState<number | null>(null);
  const [expandedSnapshot, setExpandedSnapshot] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/wiki-analysis/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPage(data.page || null);
        setSnapshots(data.snapshots || []);
        setChanges(data.changes || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/wiki-analysis"
          className="inline-flex items-center gap-2 text-pink hover:text-pink/80 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Wiki Analysis
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error || "Page not found"}
        </div>
      </div>
    );
  }

  const pageName = slug.replace(/_/g, " ");

  // Build word count timeline chart data
  const wordCountData = snapshots
    .filter((s) => s.word_count > 0)
    .map((s) => ({
      name: new Date(s.snapshot_date).getFullYear().toString(),
      words: s.word_count,
    }));

  // Build link count timeline
  const linkCountData = snapshots
    .filter((s) => s.external_link_count > 0 || s.internal_link_count > 0)
    .map((s) => ({
      name: new Date(s.snapshot_date).getFullYear().toString(),
      external: s.external_link_count,
      internal: s.internal_link_count,
    }));

  // Net link changes over time
  const netChangesData = changes.map((c) => ({
    name: new Date(c.to_date).toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
    }),
    added: c.links_added_count,
    removed: -c.links_removed_count,
  }));

  // Aggregate domain stats across all snapshots
  const allDomains: Record<string, { first: string; last: string; count: number }> = {};
  snapshots.forEach((s) => {
    const domains = Array.isArray(s.external_domains) ? s.external_domains : [];
    const dateStr = s.snapshot_date;
    domains.forEach((d: string) => {
      if (!allDomains[d]) {
        allDomains[d] = { first: dateStr, last: dateStr, count: 0 };
      }
      allDomains[d].last = dateStr;
      allDomains[d].count++;
    });
  });

  const sortedDomains = Object.entries(allDomains)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/wiki-analysis"
            className="inline-flex items-center gap-1 text-pink hover:text-pink/80 text-xs mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <h1 className="text-2xl font-heading font-bold text-[#F5F5F5]">
            {pageName}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-[#F5F5F5]/50">
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-pink hover:text-pink/80"
            >
              Wikipedia <ExternalLink className="h-3 w-3" />
            </a>
            {page.wayback_first_capture && (
              <span>
                First archived:{" "}
                {new Date(page.wayback_first_capture).toLocaleDateString()}
              </span>
            )}
            <span>{page.wayback_monthly_captures} Wayback captures</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Snapshots Analyzed" value={String(snapshots.length)} />
        <StatCard
          label="Word Count (Latest)"
          value={
            snapshots.length > 0
              ? snapshots[snapshots.length - 1].word_count.toLocaleString()
              : "—"
          }
        />
        <StatCard
          label="External Links (Latest)"
          value={
            snapshots.length > 0
              ? String(snapshots[snapshots.length - 1].external_link_count)
              : "—"
          }
        />
        <StatCard
          label="Link Changes Tracked"
          value={String(changes.length)}
        />
        <StatCard
          label="Unique Domains Linked"
          value={String(Object.keys(allDomains).length)}
        />
      </div>

      {/* Word Count Evolution Chart */}
      {wordCountData.length > 1 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink" />
            Content Growth Over Time
          </h2>
          <div className="h-[220px]">
            <AreaChart
              data={wordCountData}
              dataKey="words"
              xAxisKey="name"
              color="#FF1493"
            />
          </div>
        </div>
      )}

      {/* Link Changes Chart */}
      {netChangesData.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-pink" />
            Link Changes Between Snapshots
          </h2>
          <div className="h-[220px]">
            <BarChart
              data={netChangesData}
              dataKey="added"
              xAxisKey="name"
              color="#22c55e"
            />
          </div>
        </div>
      )}

      {/* Section/Heading Evolution */}
      {snapshots.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-pink" />
            Section Evolution
          </h2>
          <div className="space-y-2">
            {snapshots
              .filter((s) => s.h2 && Array.isArray(s.h2) && s.h2.length > 0)
              .map((s, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs">
                  <span className="text-pink font-mono w-20 shrink-0">
                    {new Date(s.snapshot_date).getFullYear()}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(s.h2 as string[]).map((h, hi) => (
                      <span
                        key={hi}
                        className="bg-pink/10 text-[#F5F5F5]/70 px-1.5 py-0.5 rounded text-[10px]"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <span className="text-[#F5F5F5]/30 shrink-0">
                    {s.word_count}w
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Link Change Timeline */}
      {changes.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-pink" />
            Link Change History
          </h2>
          <div className="divide-y divide-pink/5">
            {changes.map((c, idx) => {
              const isExpanded = expandedChange === idx;
              const fromYear = new Date(c.from_date).getFullYear();
              const toYear = new Date(c.to_date).getFullYear();
              const dateRange =
                fromYear === toYear
                  ? `${new Date(c.from_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                  : `${fromYear} → ${toYear}`;

              return (
                <div key={idx}>
                  <button
                    className="w-full flex items-center gap-3 py-2.5 text-sm hover:bg-[#F5F5F5]/5 transition-colors text-left"
                    onClick={() =>
                      setExpandedChange(isExpanded ? null : idx)
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-pink shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#F5F5F5]/30 shrink-0" />
                    )}
                    <span className="text-[#F5F5F5]/50 font-mono text-xs w-28 shrink-0">
                      {dateRange}
                    </span>
                    <span className="flex items-center gap-1 text-green-400 text-xs">
                      <Plus className="h-3 w-3" />
                      {c.links_added_count}
                    </span>
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <Minus className="h-3 w-3" />
                      {c.links_removed_count}
                    </span>
                    <span className="text-[#F5F5F5]/30 text-xs ml-auto">
                      {c.word_count_before}→{c.word_count_after}w
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pl-8 pb-3 space-y-3">
                      {/* Domains added */}
                      {c.domains_added &&
                        Array.isArray(c.domains_added) &&
                        c.domains_added.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-green-400 mb-1">
                              DOMAINS ADDED
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {c.domains_added.map((d: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Domains removed */}
                      {c.domains_removed &&
                        Array.isArray(c.domains_removed) &&
                        c.domains_removed.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-red-400 mb-1">
                              DOMAINS REMOVED
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {c.domains_removed.map(
                                (d: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded line-through"
                                  >
                                    {d}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Links added detail */}
                      {c.links_added &&
                        Array.isArray(c.links_added) &&
                        c.links_added.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-green-400 mb-1">
                              LINKS ADDED ({c.links_added_count})
                            </p>
                            <div className="space-y-0.5 max-h-40 overflow-y-auto">
                              {c.links_added.slice(0, 20).map(
                                (
                                  l: {
                                    url: string;
                                    text: string;
                                    domain: string;
                                  },
                                  i: number
                                ) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 text-[10px]"
                                  >
                                    <span className="text-green-400/60 truncate max-w-[120px]">
                                      {l.domain || ""}
                                    </span>
                                    <a
                                      href={l.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#F5F5F5]/60 hover:text-pink truncate"
                                    >
                                      {l.text || l.url}
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Links removed detail */}
                      {c.links_removed &&
                        Array.isArray(c.links_removed) &&
                        c.links_removed.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-red-400 mb-1">
                              LINKS REMOVED ({c.links_removed_count})
                            </p>
                            <div className="space-y-0.5 max-h-40 overflow-y-auto">
                              {c.links_removed.slice(0, 20).map(
                                (
                                  l: {
                                    url: string;
                                    text: string;
                                    domain: string;
                                  },
                                  i: number
                                ) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 text-[10px]"
                                  >
                                    <span className="text-red-400/60 truncate max-w-[120px]">
                                      {l.domain || ""}
                                    </span>
                                    <span className="text-[#F5F5F5]/40 truncate line-through">
                                      {l.text || l.url}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Heading changes */}
                      {c.h2_before &&
                        c.h2_after &&
                        JSON.stringify(c.h2_before) !==
                          JSON.stringify(c.h2_after) && (
                          <div>
                            <p className="text-[10px] font-semibold text-pink mb-1">
                              SECTION CHANGES
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-[#F5F5F5]/40">
                                  Before:
                                </span>
                                {(c.h2_before as string[]).map((h, i) => (
                                  <span
                                    key={i}
                                    className="block text-[#F5F5F5]/50"
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                              <div>
                                <span className="text-[#F5F5F5]/40">
                                  After:
                                </span>
                                {(c.h2_after as string[]).map((h, i) => (
                                  <span
                                    key={i}
                                    className="block text-[#F5F5F5]/70"
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Snapshot Timeline (all captured snapshots) */}
      {snapshots.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5 text-pink" />
            Captured Snapshots
          </h2>
          <div className="divide-y divide-pink/5">
            {snapshots.map((s, idx) => {
              const isExpanded = expandedSnapshot === idx;
              return (
                <div key={idx}>
                  <button
                    className="w-full flex items-center gap-3 py-2 text-sm hover:bg-[#F5F5F5]/5 transition-colors text-left"
                    onClick={() =>
                      setExpandedSnapshot(isExpanded ? null : idx)
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-pink shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#F5F5F5]/30 shrink-0" />
                    )}
                    <span className="text-[#F5F5F5]/50 font-mono text-xs w-24 shrink-0">
                      {new Date(s.snapshot_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-[#F5F5F5]/70 text-xs">
                      {s.word_count}w
                    </span>
                    <span className="text-[#F5F5F5]/40 text-xs">
                      {s.external_link_count} ext / {s.internal_link_count} int
                    </span>
                    <span className="text-[#F5F5F5]/30 text-xs ml-auto">
                      {(s.h2 as string[])?.length || 0} sections
                    </span>
                    <a
                      href={s.wayback_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink hover:text-pink/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </button>

                  {isExpanded && (
                    <div className="pl-8 pb-3 space-y-2">
                      <p className="text-xs text-[#F5F5F5]/50">
                        <strong className="text-[#F5F5F5]/70">Title:</strong>{" "}
                        {s.title}
                      </p>
                      {s.meta_description && (
                        <p className="text-xs text-[#F5F5F5]/50">
                          <strong className="text-[#F5F5F5]/70">
                            Meta:
                          </strong>{" "}
                          {s.meta_description}
                        </p>
                      )}
                      {s.text_preview && (
                        <div className="bg-[#000022] rounded p-2 text-[10px] text-[#F5F5F5]/40 max-h-32 overflow-y-auto font-mono leading-relaxed">
                          {s.text_preview.slice(0, 500)}...
                        </div>
                      )}
                      {s.external_domains &&
                        Array.isArray(s.external_domains) &&
                        s.external_domains.length > 0 && (
                          <div>
                            <p className="text-[10px] text-[#F5F5F5]/40 mb-1">
                              External domains ({s.external_domains.length}):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(s.external_domains as string[])
                                .slice(0, 20)
                                .map((d, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-pink/10 text-pink/70 px-1.5 py-0.5 rounded"
                                  >
                                    {d}
                                  </span>
                                ))}
                              {(s.external_domains as string[]).length > 20 && (
                                <span className="text-[10px] text-[#F5F5F5]/30">
                                  +{(s.external_domains as string[]).length - 20} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All External Domains Ever Linked */}
      {sortedDomains.length > 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
          <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-pink" />
            All External Domains Referenced
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {sortedDomains.map(([domain, info]) => (
              <div
                key={domain}
                className="flex items-center justify-between text-xs py-1 px-2 hover:bg-[#F5F5F5]/5 rounded"
              >
                <span className="text-[#F5F5F5]/70 truncate">{domain}</span>
                <div className="flex items-center gap-3 shrink-0 text-[#F5F5F5]/40">
                  <span>
                    {new Date(info.first).getFullYear()}–
                    {new Date(info.last).getFullYear()}
                  </span>
                  <span className="text-pink font-medium">
                    {info.count} snaps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {snapshots.length === 0 && changes.length === 0 && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-8 text-center">
          <Clock className="h-8 w-8 text-pink/30 mx-auto mb-3" />
          <p className="text-[#F5F5F5]/50">
            Deep analysis is still running for this page. Check back in a few
            minutes.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-3">
      <p className="text-[10px] text-[#F5F5F5]/40">{label}</p>
      <p className="text-lg font-heading font-bold text-[#F5F5F5]">{value}</p>
    </div>
  );
}
