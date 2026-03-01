"use client";

import { useState, useEffect } from "react";
import { BarChart3, ExternalLink, Link2, Clock, TrendingUp } from "lucide-react";

interface WikiPage {
  page: string;
  internal_links: number;
  external_links: number;
  top_domains: string;
  first_capture: string;
  total_snapshots: number;
  keyword: string;
  serp_position: number;
}

export function WikiResearchClient() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"external_links" | "total_snapshots" | "serp_position">("external_links");

  useEffect(() => {
    fetch("https://api.seobandwagon.dev/public/research/wiki-pages.json")
      .then((res) => res.json())
      .then((data) => {
        setPages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sortedPages = [...pages].sort((a, b) => {
    if (sortBy === "serp_position") return a[sortBy] - b[sortBy];
    return b[sortBy] - a[sortBy];
  });

  const totalInternal = pages.reduce((sum, p) => sum + p.internal_links, 0);
  const totalExternal = pages.reduce((sum, p) => sum + p.external_links, 0);
  const totalSnapshots = pages.reduce((sum, p) => sum + (p.total_snapshots || 0), 0);

  const formatDate = (ts: string) => {
    if (!ts) return "—";
    return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wikipedia Link Research</h1>
        <p className="text-slate-400">
          Analysis of 25 Wikipedia pages ranking for digital marketing keywords
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Link2} label="Total Internal Links" value={totalInternal.toLocaleString()} />
        <StatCard icon={ExternalLink} label="Total External Links" value={totalExternal.toLocaleString()} />
        <StatCard icon={Clock} label="Wayback Snapshots" value={totalSnapshots.toLocaleString()} />
        <StatCard icon={BarChart3} label="Pages Analyzed" value={pages.length.toString()} />
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy("external_links")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === "external_links" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          By External Links
        </button>
        <button
          onClick={() => setSortBy("total_snapshots")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === "total_snapshots" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          By History
        </button>
        <button
          onClick={() => setSortBy("serp_position")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === "serp_position" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          By SERP Position
        </button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Wikipedia Page</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Keyword</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">SERP #</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Internal</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">External</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Snapshots</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">First Archived</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Top Domains</th>
            </tr>
          </thead>
          <tbody>
            {sortedPages.map((page) => (
              <tr key={page.page} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-3 px-4">
                  <a
                    href={`https://en.wikipedia.org/wiki/${page.page}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink hover:underline"
                  >
                    {page.page.replace(/_/g, " ")}
                  </a>
                </td>
                <td className="py-3 px-4 text-sm text-slate-300">{page.keyword}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    page.serp_position === 1 ? "bg-green-500/20 text-green-400" :
                    page.serp_position <= 3 ? "bg-blue-500/20 text-blue-400" :
                    page.serp_position <= 10 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>
                    #{page.serp_position}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">{page.internal_links}</td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">{page.external_links}</td>
                <td className="py-3 px-4 text-right text-sm text-slate-300">{page.total_snapshots || "—"}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{formatDate(page.first_capture)}</td>
                <td className="py-3 px-4 text-sm text-slate-400 truncate max-w-[200px]">{page.top_domains}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-slate-500 mt-8">
        Data collected on 2026-02-28 using DataForSEO SERP API and Wayback Machine CDX API
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
