"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface TrackedKeyword {
  id: string;
  keyword: string;
  domain: string;
  last_position: number | null;
  last_checked_at: string | null;
  created_at: string;
}

interface DomainStats {
  domain: string;
  total: number;
  top10: number;
  top20: number;
  top50: number;
  unranked: number;
}

export function KeywordDashboard() {
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"keyword" | "position" | "created">("position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      console.error("Error fetching keywords:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique domains
  const domains = useMemo(() => {
    const domainSet = new Set(keywords.map((k) => k.domain));
    return Array.from(domainSet).sort();
  }, [keywords]);

  // Calculate domain stats
  const domainStats = useMemo(() => {
    const stats: Record<string, DomainStats> = {};
    
    keywords.forEach((k) => {
      if (!stats[k.domain]) {
        stats[k.domain] = {
          domain: k.domain,
          total: 0,
          top10: 0,
          top20: 0,
          top50: 0,
          unranked: 0,
        };
      }
      stats[k.domain].total++;
      
      if (k.last_position === null) {
        stats[k.domain].unranked++;
      } else if (k.last_position <= 10) {
        stats[k.domain].top10++;
      } else if (k.last_position <= 20) {
        stats[k.domain].top20++;
      } else if (k.last_position <= 50) {
        stats[k.domain].top50++;
      } else {
        stats[k.domain].unranked++;
      }
    });
    
    return Object.values(stats);
  }, [keywords]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywords.filter((k) => {
      const matchesSearch = k.keyword.toLowerCase().includes(search.toLowerCase());
      const matchesDomain = selectedDomain === "all" || k.domain === selectedDomain;
      return matchesSearch && matchesDomain;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "keyword") {
        cmp = a.keyword.localeCompare(b.keyword);
      } else if (sortBy === "position") {
        const posA = a.last_position ?? 999;
        const posB = b.last_position ?? 999;
        cmp = posA - posB;
      } else {
        cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [keywords, search, selectedDomain, sortBy, sortDir]);

  // Position color helper
  const getPositionColor = (pos: number | null) => {
    if (pos === null) return "text-[#F5F5F5]/30";
    if (pos <= 3) return "text-green-400";
    if (pos <= 10) return "text-green-300";
    if (pos <= 20) return "text-yellow-400";
    if (pos <= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getPositionBg = (pos: number | null) => {
    if (pos === null) return "bg-[#F5F5F5]/5";
    if (pos <= 3) return "bg-green-500/20";
    if (pos <= 10) return "bg-green-500/10";
    if (pos <= 20) return "bg-yellow-500/10";
    if (pos <= 50) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-pink animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[#F5F5F5] tracking-wide">
            Keyword Tracker
          </h1>
          <p className="text-sm text-[#F5F5F5]/40 mt-1">
            {keywords.length} keywords across {domains.length} domains
          </p>
        </div>
        <button
          onClick={fetchKeywords}
          className="p-2 rounded-lg bg-[#F5F5F5]/5 text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Domain Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {domainStats.map((stat) => (
          <button
            key={stat.domain}
            onClick={() => setSelectedDomain(stat.domain === selectedDomain ? "all" : stat.domain)}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              selectedDomain === stat.domain
                ? "bg-pink/10 border-pink"
                : "bg-[#000022] border-pink/30 hover:border-pink/50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#F5F5F5] font-medium truncate">
                {stat.domain}
              </span>
              <span className="text-[#F5F5F5]/40 text-sm">{stat.total} kw</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 text-center py-1 rounded bg-green-500/20">
                <div className="text-green-400 font-bold">{stat.top10}</div>
                <div className="text-[10px] text-green-400/70">Top 10</div>
              </div>
              <div className="flex-1 text-center py-1 rounded bg-yellow-500/20">
                <div className="text-yellow-400 font-bold">{stat.top20}</div>
                <div className="text-[10px] text-yellow-400/70">11-20</div>
              </div>
              <div className="flex-1 text-center py-1 rounded bg-orange-500/20">
                <div className="text-orange-400 font-bold">{stat.top50}</div>
                <div className="text-[10px] text-orange-400/70">21-50</div>
              </div>
              <div className="flex-1 text-center py-1 rounded bg-[#F5F5F5]/5">
                <div className="text-[#F5F5F5]/50 font-bold">{stat.unranked}</div>
                <div className="text-[10px] text-[#F5F5F5]/30">50+</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/40" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] placeholder-[#F5F5F5]/30 focus:outline-none focus:border-pink/50"
          />
        </div>

        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
        >
          <option value="all">All Domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split("-") as [typeof sortBy, typeof sortDir];
            setSortBy(by);
            setSortDir(dir);
          }}
          className="px-4 py-2 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-pink/50"
        >
          <option value="position-asc">Position (Best First)</option>
          <option value="position-desc">Position (Worst First)</option>
          <option value="keyword-asc">Keyword (A-Z)</option>
          <option value="keyword-desc">Keyword (Z-A)</option>
          <option value="created-desc">Newest First</option>
          <option value="created-asc">Oldest First</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#F5F5F5]/40 mb-4">
        Showing {filteredKeywords.length} of {keywords.length} keywords
      </p>

      {/* Keyword Table */}
      <div className="rounded-xl bg-[#000022] border-2 border-pink/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pink/20 bg-[#F5F5F5]/5">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#F5F5F5]/60 uppercase">
                  Keyword
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#F5F5F5]/60 uppercase">
                  Domain
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#F5F5F5]/60 uppercase w-24">
                  Position
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[#F5F5F5]/60 uppercase">
                  Last Checked
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#F5F5F5]/30">
                    No keywords found
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((kw) => (
                  <tr
                    key={kw.id}
                    className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-[#F5F5F5]">{kw.keyword}</td>
                    <td className="py-3 px-4 text-[#F5F5F5]/60 text-sm">{kw.domain}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold ${getPositionBg(
                          kw.last_position
                        )} ${getPositionColor(kw.last_position)}`}
                      >
                        {kw.last_position ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#F5F5F5]/40 text-sm">
                      {kw.last_checked_at
                        ? new Date(kw.last_checked_at).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
