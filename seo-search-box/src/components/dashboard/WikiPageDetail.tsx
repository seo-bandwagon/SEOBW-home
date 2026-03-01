"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Clock,
  FileText,
  Link2,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Globe,
  BarChart3,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { AreaChart, BarChart } from "@/components/charts";

interface Snapshot {
  revid: number;
  snapshot_date: string;
  size: number;
  sections: string[];
  section_count: number;
  external_links: string[];
  external_link_count: number;
  external_domains: string[];
  domain_count: number;
}

interface LinkDiff {
  from_revid: number;
  to_revid: number;
  from_date: string;
  to_date: string;
  links_added: string[];
  links_removed: string[];
  domains_added: string[];
  domains_removed: string[];
  links_added_count: number;
  links_removed_count: number;
  size_before: number;
  size_after: number;
  sections_before: string[];
  sections_after: string[];
}

interface BigEdit {
  revid: number;
  timestamp: string;
  size: number;
  size_delta: number;
  comment: string;
}

interface RevTimeline {
  month: string;
  size: number;
  edits: number;
}

interface EditHotspot {
  month: string;
  edit_count: number;
  total_change: number;
}

interface PageData {
  slug: string;
  url: string;
  title: string;
  wayback_monthly_captures: number;
  wayback_first_capture: string;
  external_link_count: number;
}

interface RevStats {
  total_revisions: number;
  first_revision: string;
  last_revision: string;
  min_size: number;
  max_size: number;
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `http://${url}`);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function WikiPageDetail({ slug }: { slug: string }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [revStats, setRevStats] = useState<RevStats | null>(null);
  const [revTimeline, setRevTimeline] = useState<RevTimeline[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [linkDiffs, setLinkDiffs] = useState<LinkDiff[]>([]);
  const [editHotspots, setEditHotspots] = useState<EditHotspot[]>([]);
  const [bigEdits, setBigEdits] = useState<BigEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDiff, setExpandedDiff] = useState<number | null>(null);
  const [expandedSnap, setExpandedSnap] = useState<number | null>(null);
  const [showAllDomains, setShowAllDomains] = useState(false);

  useEffect(() => {
    fetch(`/api/wiki-analysis/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPage(data.page || null);
        setRevStats(data.revisionStats || null);
        setRevTimeline(data.revisionTimeline || []);
        setSnapshots(data.snapshots || []);
        setLinkDiffs(data.linkDiffs || []);
        setEditHotspots(data.editHotspots || []);
        setBigEdits(data.bigEdits || []);
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
        <Link href="/wiki-analysis" className="inline-flex items-center gap-2 text-pink hover:text-pink/80 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error || "Page not found"}
        </div>
      </div>
    );
  }

  const pageName = slug.replace(/_/g, " ");

  // Chart data
  const sizeData = revTimeline.map((r) => ({
    name: r.month?.slice(0, 7) || "",
    size: Math.round(Number(r.size) / 1000),
  }));

  const editData = revTimeline.map((r) => ({
    name: r.month?.slice(0, 7) || "",
    edits: Number(r.edits),
  }));

  const linkData = snapshots.map((s) => ({
    name: new Date(s.snapshot_date).getFullYear().toString(),
    links: s.external_link_count,
    domains: s.domain_count,
  }));

  // All domains ever seen
  const allDomains: Record<string, { first: string; last: string; appearances: number }> = {};
  snapshots.forEach((s) => {
    (s.external_domains || []).forEach((d: string) => {
      if (!allDomains[d]) allDomains[d] = { first: s.snapshot_date, last: s.snapshot_date, appearances: 0 };
      allDomains[d].last = s.snapshot_date;
      allDomains[d].appearances++;
    });
  });
  const sortedDomains = Object.entries(allDomains).sort((a, b) => b[1].appearances - a[1].appearances);

  const firstYear = revStats?.first_revision ? new Date(revStats.first_revision).getFullYear() : "?";
  const lastYear = revStats?.last_revision ? new Date(revStats.last_revision).getFullYear() : "?";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Link href="/wiki-analysis" className="inline-flex items-center gap-1 text-pink hover:text-pink/80 text-xs mb-2">
          <ArrowLeft className="h-3 w-3" /> Back to all pages
        </Link>
        <h1 className="text-3xl font-heading font-bold text-[#F5F5F5]">{pageName}</h1>
        <p className="text-[#F5F5F5]/50 mt-1 text-sm">
          Wikipedia article analysis — {firstYear} to {lastYear} ·{" "}
          <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-pink hover:text-pink/80">
            View on Wikipedia <ExternalLink className="h-3 w-3 inline" />
          </a>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total Revisions" value={revStats ? Number(revStats.total_revisions).toLocaleString() : "—"} />
        <Stat label="Article Size" value={revStats ? `${Math.round(Number(revStats.max_size) / 1000)}KB` : "—"} />
        <Stat label="External Links" value={snapshots.length > 0 ? String(snapshots[snapshots.length - 1].external_link_count) : "—"} />
        <Stat label="Unique Domains" value={String(Object.keys(allDomains).length)} />
        <Stat label="Deep Snapshots" value={String(snapshots.length)} />
      </div>

      {/* Article Size Over Time */}
      {sizeData.length > 2 && (
        <Section icon={<FileText className="h-5 w-5 text-pink" />} title="Article Size Over Time (KB)">
          <div className="h-[220px]">
            <AreaChart data={sizeData} dataKey="size" xAxisKey="name" color="#FF1493" />
          </div>
        </Section>
      )}

      {/* Edit Activity */}
      {editData.length > 2 && (
        <Section icon={<Edit3 className="h-5 w-5 text-pink" />} title="Monthly Edit Activity">
          <div className="h-[200px]">
            <BarChart data={editData} dataKey="edits" xAxisKey="name" color="#FF1493" />
          </div>
        </Section>
      )}

      {/* External Links Over Time */}
      {linkData.length > 1 && (
        <Section icon={<Link2 className="h-5 w-5 text-pink" />} title="External Links & Domains Over Time">
          <div className="h-[220px]">
            <AreaChart data={linkData} dataKey="links" xAxisKey="name" color="#22c55e" />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-[#F5F5F5]/40">
            {linkData.length > 0 && (
              <>
                <span>First snapshot: {linkData[0].links} links</span>
                <span>Latest: {linkData[linkData.length - 1].links} links across {linkData[linkData.length - 1].domains} domains</span>
              </>
            )}
          </div>
        </Section>
      )}

      {/* Section Evolution */}
      {snapshots.some((s) => s.section_count > 0) && (
        <Section icon={<BarChart3 className="h-5 w-5 text-pink" />} title="Section Evolution">
          <div className="space-y-2">
            {snapshots
              .filter((s) => s.section_count > 0)
              .map((s, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs">
                  <span className="text-pink font-mono w-12 shrink-0">
                    {new Date(s.snapshot_date).getFullYear()}
                  </span>
                  <span className="text-[#F5F5F5]/30 w-10 shrink-0 text-right">{s.section_count}§</span>
                  <div className="flex flex-wrap gap-1">
                    {(s.sections || []).slice(0, 20).map((h: string, hi: number) => (
                      <span key={hi} className="bg-pink/10 text-[#F5F5F5]/60 px-1.5 py-0.5 rounded text-[10px]">
                        {h}
                      </span>
                    ))}
                    {(s.sections || []).length > 20 && (
                      <span className="text-[#F5F5F5]/30 text-[10px]">+{(s.sections || []).length - 20}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* Link Change History */}
      {linkDiffs.length > 0 && (
        <Section icon={<Clock className="h-5 w-5 text-pink" />} title="Link Change History">
          <div className="divide-y divide-pink/5">
            {linkDiffs.map((d, idx) => {
              const isExpanded = expandedDiff === idx;
              const fromYr = new Date(d.from_date).getFullYear();
              const toYr = new Date(d.to_date).getFullYear();
              const label = fromYr === toYr ? String(toYr) : `${fromYr}→${toYr}`;
              const sizeDelta = Number(d.size_after) - Number(d.size_before);

              return (
                <div key={idx}>
                  <button
                    className="w-full flex items-center gap-3 py-2 text-sm hover:bg-[#F5F5F5]/5 transition-colors text-left"
                    onClick={() => setExpandedDiff(isExpanded ? null : idx)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-pink shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#F5F5F5]/30 shrink-0" />}
                    <span className="font-mono text-xs text-[#F5F5F5]/50 w-20 shrink-0">{label}</span>
                    <span className="flex items-center gap-1 text-green-400 text-xs"><Plus className="h-3 w-3" />{d.links_added_count}</span>
                    <span className="flex items-center gap-1 text-red-400 text-xs"><Minus className="h-3 w-3" />{d.links_removed_count}</span>
                    <span className={`text-xs ml-2 ${sizeDelta >= 0 ? "text-green-400/60" : "text-red-400/60"}`}>
                      {sizeDelta >= 0 ? "+" : ""}{Math.round(sizeDelta / 1000)}KB
                    </span>
                    {d.domains_added?.length > 0 && (
                      <span className="text-[10px] text-green-400/40 ml-auto">+{d.domains_added.length} domains</span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pl-10 pb-3 space-y-3">
                      {d.domains_added?.length > 0 && (
                        <DomainList label="DOMAINS ADDED" items={d.domains_added} color="green" />
                      )}
                      {d.domains_removed?.length > 0 && (
                        <DomainList label="DOMAINS REMOVED" items={d.domains_removed} color="red" />
                      )}
                      {d.links_added?.length > 0 && (
                        <LinkList label={`LINKS ADDED (${d.links_added_count})`} items={d.links_added} color="green" />
                      )}
                      {d.links_removed?.length > 0 && (
                        <LinkList label={`LINKS REMOVED (${d.links_removed_count})`} items={d.links_removed} color="red" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Biggest Edits */}
      {bigEdits.length > 0 && (
        <Section icon={<AlertTriangle className="h-5 w-5 text-pink" />} title="Largest Edits">
          <div className="space-y-1">
            {bigEdits.slice(0, 10).map((e, idx) => {
              const delta = Number(e.size_delta);
              const date = new Date(e.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
              return (
                <div key={idx} className="flex items-center gap-3 text-xs py-1">
                  <span className="text-[#F5F5F5]/40 font-mono w-24 shrink-0">{date}</span>
                  <span className={`font-mono w-16 shrink-0 text-right ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {delta >= 0 ? "+" : ""}{delta.toLocaleString()}
                  </span>
                  <span className="text-[#F5F5F5]/50 truncate">{e.comment || "(no comment)"}</span>
                  <a
                    href={`https://en.wikipedia.org/w/index.php?diff=${e.revid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink hover:text-pink/80 shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* All External Domains */}
      {sortedDomains.length > 0 && (
        <Section icon={<Globe className="h-5 w-5 text-pink" />} title={`All External Domains (${sortedDomains.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
            {(showAllDomains ? sortedDomains : sortedDomains.slice(0, 20)).map(([domain, info]) => (
              <div key={domain} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-[#F5F5F5]/5 rounded">
                <span className="text-[#F5F5F5]/70 truncate">{domain}</span>
                <span className="text-[#F5F5F5]/30 shrink-0 ml-2">
                  {new Date(info.first).getFullYear()}–{new Date(info.last).getFullYear()} · {info.appearances} snaps
                </span>
              </div>
            ))}
          </div>
          {sortedDomains.length > 20 && (
            <button
              onClick={() => setShowAllDomains(!showAllDomains)}
              className="text-xs text-pink hover:text-pink/80 mt-2"
            >
              {showAllDomains ? "Show less" : `Show all ${sortedDomains.length} domains`}
            </button>
          )}
        </Section>
      )}

      {/* Edit Hotspots */}
      {editHotspots.length > 0 && (
        <Section icon={<TrendingUp className="h-5 w-5 text-pink" />} title="Most Active Months">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {editHotspots.slice(0, 10).map((h, idx) => (
              <div key={idx} className="bg-[#000022] rounded px-3 py-2 text-center">
                <p className="text-xs text-[#F5F5F5]/40">
                  {new Date(h.month).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </p>
                <p className="text-lg font-heading font-bold text-pink">{Number(h.edit_count)}</p>
                <p className="text-[10px] text-[#F5F5F5]/30">edits</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* No data state */}
      {snapshots.length === 0 && !revStats && (
        <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-8 text-center">
          <Clock className="h-8 w-8 text-pink/30 mx-auto mb-3" />
          <p className="text-[#F5F5F5]/50">Analysis is still running for this page. Check back shortly.</p>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-4">
      <h2 className="text-lg font-heading font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F5F5F5]/5 border border-pink/20 rounded-lg p-3">
      <p className="text-[10px] text-[#F5F5F5]/40">{label}</p>
      <p className="text-lg font-heading font-bold text-[#F5F5F5]">{value}</p>
    </div>
  );
}

function DomainList({ label, items, color }: { label: string; items: string[]; color: "green" | "red" }) {
  const cls = color === "green" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400 line-through";
  return (
    <div>
      <p className={`text-[10px] font-semibold ${color === "green" ? "text-green-400" : "text-red-400"} mb-1`}>{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((d: string, i: number) => (
          <span key={i} className={`text-[10px] ${cls} px-1.5 py-0.5 rounded`}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function LinkList({ label, items, color }: { label: string; items: string[]; color: "green" | "red" }) {
  return (
    <div>
      <p className={`text-[10px] font-semibold ${color === "green" ? "text-green-400" : "text-red-400"} mb-1`}>{label}</p>
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {items.slice(0, 30).map((url: string, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className={`${color === "green" ? "text-green-400/50" : "text-red-400/50"} w-28 shrink-0 truncate`}>
              {extractDomain(url)}
            </span>
            <a href={url} target="_blank" rel="noopener noreferrer"
               className={`${color === "red" ? "text-[#F5F5F5]/30 line-through" : "text-[#F5F5F5]/60 hover:text-pink"} truncate`}>
              {url}
            </a>
          </div>
        ))}
        {items.length > 30 && <p className="text-[#F5F5F5]/30 text-[10px]">+{items.length - 30} more</p>}
      </div>
    </div>
  );
}
