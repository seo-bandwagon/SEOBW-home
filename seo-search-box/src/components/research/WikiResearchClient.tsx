"use client";

import { useState, useEffect } from "react";
import { BarChart3, ExternalLink, Link2, Clock, TrendingUp, History } from "lucide-react";

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

interface EvolutionData {
  pages: {
    seo: PageEvolution;
    digital_marketing: PageEvolution;
  };
  insights: string[];
}

interface PageEvolution {
  title: string;
  first_captured: string;
  total_snapshots: number;
  growth: { year: number; words: number; chars: number }[];
  term_trends: Record<string, number[]>;
  years: number[];
}

export function WikiResearchClient() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [evolution, setEvolution] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "seo" | "dm">("overview");
  const [sortBy, setSortBy] = useState<"external_links" | "total_snapshots" | "serp_position">("external_links");

  useEffect(() => {
    Promise.all([
      fetch("https://api.seobandwagon.dev/public/research/wiki-pages.json").then(r => r.json()),
      fetch("https://api.seobandwagon.dev/public/research/evolution_analysis.json").then(r => r.json())
    ]).then(([pagesData, evoData]) => {
      setPages(pagesData);
      setEvolution(evoData);
      setLoading(false);
    }).catch(() => setLoading(false));
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
    if (ts.includes("-")) return ts;
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
        <h1 className="text-3xl font-bold text-white mb-2">Wikipedia Link Analysis</h1>
        <p className="text-slate-400">
          Historical analysis of Wikipedia pages ranking for digital marketing keywords using Wayback Machine
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "overview" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Overview (25 Pages)
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "seo" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <History className="w-4 h-4 inline mr-1" />
          SEO Page History
        </button>
        <button
          onClick={() => setActiveTab("dm")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "dm" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <History className="w-4 h-4 inline mr-1" />
          Digital Marketing History
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Link2} label="Total Internal Links" value={totalInternal.toLocaleString()} />
            <StatCard icon={ExternalLink} label="Total External Links" value={totalExternal.toLocaleString()} />
            <StatCard icon={Clock} label="Wayback Snapshots" value={totalSnapshots.toLocaleString()} />
            <StatCard icon={BarChart3} label="Pages Analyzed" value={pages.length.toString()} />
          </div>

          {/* Insights */}
          {evolution && (
            <div className="rounded-xl bg-gradient-to-r from-pink/10 to-purple-500/10 border border-pink/30 p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink" />
                Key Insights
              </h3>
              <ul className="space-y-2">
                {evolution.insights.map((insight, i) => (
                  <li key={i} className="text-slate-300 flex items-start gap-2">
                    <span className="text-pink mt-1">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setSortBy("external_links")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${sortBy === "external_links" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>By External Links</button>
            <button onClick={() => setSortBy("total_snapshots")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${sortBy === "total_snapshots" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>By History</button>
            <button onClick={() => setSortBy("serp_position")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${sortBy === "serp_position" ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>By SERP Position</button>
          </div>

          {/* Data Table */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-x-auto">
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
                </tr>
              </thead>
              <tbody>
                {sortedPages.map((page) => (
                  <tr key={page.page} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <a href={`https://en.wikipedia.org/wiki/${page.page}`} target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">{page.page.replace(/_/g, " ")}</a>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{page.keyword}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${page.serp_position === 1 ? "bg-green-500/20 text-green-400" : page.serp_position <= 3 ? "bg-blue-500/20 text-blue-400" : page.serp_position <= 10 ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400"}`}>#{page.serp_position}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-slate-300">{page.internal_links}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-300">{page.external_links}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-300">{page.total_snapshots || "—"}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{formatDate(page.first_capture)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "seo" && evolution && (
        <PageHistoryView data={evolution.pages.seo} />
      )}

      {activeTab === "dm" && evolution && (
        <PageHistoryView data={evolution.pages.digital_marketing} />
      )}

      <p className="text-center text-sm text-slate-500 mt-8">
        Data collected 2026-02-28 using DataForSEO SERP API and Wayback Machine CDX API
      </p>
    </div>
  );
}

function PageHistoryView({ data }: { data: PageEvolution }) {
  const maxWords = Math.max(...data.growth.map(g => g.words));
  
  return (
    <div className="space-y-8">
      {/* Page Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="First Captured" value={data.first_captured} />
        <StatCard icon={History} label="Total Snapshots" value={data.total_snapshots.toLocaleString()} />
        <StatCard icon={TrendingUp} label="Word Growth" value={`${data.growth[0]?.words || 0} → ${data.growth[data.growth.length - 1]?.words || 0}`} />
      </div>

      {/* Content Growth Chart */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Content Growth Over Time</h3>
        <div className="flex items-end gap-2 h-48">
          {data.growth.map((g) => (
            <div key={g.year} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-pink to-purple-500 rounded-t"
                style={{ height: `${(g.words / maxWords) * 100}%` }}
              />
              <span className="text-xs text-slate-400 mt-2">{g.year}</span>
              <span className="text-xs text-slate-500">{g.words.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Term Trends */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Term Frequency Over Time</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-2 px-3">Term</th>
                {data.years.map(y => <th key={y} className="text-right py-2 px-3">{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.term_trends).map(([term, values]) => (
                <tr key={term} className="border-t border-slate-700/50">
                  <td className="py-2 px-3 text-slate-300 font-medium">{term}</td>
                  {values.map((v, i) => (
                    <td key={i} className="text-right py-2 px-3">
                      <span className={v > 0 ? "text-green-400" : "text-slate-600"}>{v}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
