"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface KeywordRow {
  keyword: string;
  target_url: string | null;
  pillar: string | null;
  volume: number;
  cpc: number;
  difficulty: number | null;
  target_position: number | null;
  intent: string | null;
  domain: string;
  et: number | null;
  ev: number | null;
}

type SortKey = keyof KeywordRow;
type SortDir = "asc" | "desc";

const PILLAR_COLORS: Record<string, string> = {
  "printing": "bg-blue-500/20 text-blue-300 border-blue-500/40",
  "labels": "bg-purple-500/20 text-purple-300 border-purple-500/40",
  "packaging": "bg-green-500/20 text-green-300 border-green-500/40",
  "services": "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  "equipment": "bg-orange-500/20 text-orange-300 border-orange-500/40",
};

function getPillarColor(pillar: string | null): string {
  if (!pillar) return "bg-gray-500/20 text-gray-300 border-gray-500/40";
  const key = pillar.toLowerCase();
  return PILLAR_COLORS[key] ?? "bg-pink-500/20 text-pink-300 border-pink-500/40";
}

function getDifficultyColor(difficulty: number | null): string {
  if (difficulty === null) return "text-[#F5F5F5]/40";
  if (difficulty <= 30) return "text-green-400";
  if (difficulty <= 60) return "text-yellow-400";
  return "text-red-400";
}

function formatCurrency(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

function formatNumber(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return String(val);
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-[#F5F5F5]/30 inline ml-1" />;
  if (sortDir === "asc") return <ChevronUp className="h-3 w-3 text-pink-400 inline ml-1" />;
  return <ChevronDown className="h-3 w-3 text-pink-400 inline ml-1" />;
}

export function ContentPlanClient() {
  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("ev");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pillarFilter, setPillarFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "gap">("all");

  useEffect(() => {
    fetch("/api/content-plan?domain=mastercontrolpress.com")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setRows(json.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pillars = useMemo(() => {
    const set = new Set(rows.map((r) => r.pillar ?? "Uncategorized"));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const pillarMatch =
        pillarFilter === "all" ||
        (r.pillar ?? "Uncategorized") === pillarFilter;
      const isPublished = !!r.target_url;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "published" && isPublished) ||
        (statusFilter === "gap" && !isPublished);
      return pillarMatch && statusMatch;
    });
  }, [rows, pillarFilter, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => {
    const totalET = rows.reduce((s, r) => s + (r.et ?? 0), 0);
    const totalEV = rows.reduce((s, r) => s + (r.ev ?? 0), 0);
    const gapCount = rows.filter((r) => !r.target_url).length;
    const noPositionCount = rows.filter((r) => r.target_position === null).length;
    return { totalET, totalEV, gapCount, noPositionCount };
  }, [rows]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const thClass =
    "px-4 py-3 text-left text-xs font-heading tracking-wider text-[#F5F5F5]/50 uppercase cursor-pointer select-none hover:text-[#F5F5F5] transition-colors whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-[#F5F5F5]/80";

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Keywords", value: rows.length.toString() },
          { label: "Total ET / mo", value: formatNumber(stats.totalET) },
          { label: "Total EV / mo", value: formatCurrency(stats.totalEV) },
          { label: "Content Gaps", value: stats.gapCount.toString() },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[#F5F5F5]/10 bg-[#F5F5F5]/5 px-5 py-4"
          >
            <p className="text-xs font-heading tracking-widest text-[#F5F5F5]/40 uppercase mb-1">
              {label}
            </p>
            <p className="text-2xl font-heading text-[#F5F5F5]">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-heading tracking-widest text-[#F5F5F5]/40 uppercase">
            Pillar
          </label>
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            className="rounded-lg border border-[#F5F5F5]/10 bg-[#000022] text-[#F5F5F5] px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
          >
            {pillars.map((p) => (
              <option key={p} value={p}>
                {p === "all" ? "All Pillars" : p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-heading tracking-widest text-[#F5F5F5]/40 uppercase">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "published" | "gap")
            }
            className="rounded-lg border border-[#F5F5F5]/10 bg-[#000022] text-[#F5F5F5] px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="gap">Gap (No Page)</option>
          </select>
        </div>
        <div className="flex items-end">
          <p className="text-xs text-[#F5F5F5]/40 pb-2">
            {sorted.length} keyword{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* State: loading / error / empty */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
          <span className="ml-3 text-[#F5F5F5]/50">Loading content plan…</span>
        </div>
      )}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400">
          {error}
        </div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-20 text-[#F5F5F5]/40">
          No keywords match the current filters.
        </div>
      )}

      {/* Table */}
      {!loading && !error && sorted.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#F5F5F5]/10">
          <table className="w-full border-collapse">
            <thead className="bg-[#F5F5F5]/5 border-b border-[#F5F5F5]/10">
              <tr>
                {(
                  [
                    ["keyword", "Keyword"],
                    ["target_url", "Target URL"],
                    ["pillar", "Pillar"],
                    ["volume", "Volume"],
                    ["difficulty", "Difficulty"],
                    ["cpc", "CPC"],
                    ["et", "ET"],
                    ["ev", "EV"],
                    [null, "Status"],
                  ] as [SortKey | null, string][]
                ).map(([key, label]) => (
                  <th
                    key={label}
                    className={thClass}
                    onClick={() => key && handleSort(key)}
                  >
                    {label}
                    {key && (
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const isPublished = !!row.target_url;
                const slug = row.target_url
                  ? row.target_url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "") || "/"
                  : null;

                return (
                  <tr
                    key={`${row.keyword}-${i}`}
                    className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5 transition-colors"
                  >
                    {/* Keyword */}
                    <td className={`${tdClass} font-medium text-[#F5F5F5] max-w-[200px]`}>
                      <span className="block truncate" title={row.keyword}>
                        {row.keyword}
                      </span>
                      {row.intent && (
                        <span className="text-[10px] text-[#F5F5F5]/30 uppercase tracking-wider">
                          {row.intent}
                        </span>
                      )}
                    </td>

                    {/* Target URL */}
                    <td className={`${tdClass} max-w-[180px]`}>
                      {slug ? (
                        <span
                          className="text-pink-400 text-xs font-mono truncate block"
                          title={row.target_url ?? ""}
                        >
                          {slug}
                        </span>
                      ) : (
                        <span className="text-[#F5F5F5]/30 text-xs italic">No page yet</span>
                      )}
                    </td>

                    {/* Pillar */}
                    <td className={tdClass}>
                      {row.pillar ? (
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-heading tracking-wider uppercase ${getPillarColor(row.pillar)}`}
                        >
                          {row.pillar}
                        </span>
                      ) : (
                        <span className="text-[#F5F5F5]/20 text-xs">—</span>
                      )}
                    </td>

                    {/* Volume */}
                    <td className={tdClass}>{formatNumber(row.volume)}</td>

                    {/* Difficulty */}
                    <td className={`${tdClass} font-mono font-medium ${getDifficultyColor(row.difficulty)}`}>
                      {row.difficulty !== null ? row.difficulty : "—"}
                    </td>

                    {/* CPC */}
                    <td className={tdClass}>
                      {row.cpc > 0 ? `$${row.cpc.toFixed(2)}` : "—"}
                    </td>

                    {/* ET */}
                    <td className={`${tdClass} text-[#F5F5F5]/70`}>
                      {row.et !== null ? formatNumber(row.et) : <span className="text-[#F5F5F5]/30">—</span>}
                    </td>

                    {/* EV */}
                    <td className={`${tdClass} font-medium text-green-400`}>
                      {row.ev !== null ? formatCurrency(row.ev) : <span className="text-[#F5F5F5]/30">—</span>}
                    </td>

                    {/* Status */}
                    <td className={tdClass}>
                      {isPublished ? (
                        <span className="inline-block rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-heading tracking-wider uppercase text-green-400">
                          Published
                        </span>
                      ) : (
                        <span className="inline-block rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-heading tracking-wider uppercase text-yellow-400">
                          Gap
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
