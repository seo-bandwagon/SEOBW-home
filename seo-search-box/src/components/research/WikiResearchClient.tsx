"use client";

import { useState, useEffect } from "react";
import { BarChart3, ExternalLink, Link2, Clock, TrendingUp, History, FileText, Search, BookOpen } from "lucide-react";

interface CompleteAnalysis {
  generated: string;
  page: string;
  summary: {
    total_unique_links: number;
    link_counts_by_year: Record<string, number>;
  };
  year_by_year: {
    year: number;
    total_external_links: number;
    added: string[];
    removed: string[];
    all_links: string[];
  }[];
  domain_analysis: {
    top_domains: { domain: string; total_citations: number }[];
  };
  phrase_analysis: {
    years: number[];
    phrases: Record<string, Record<string, number>>;
  };
  observations: { finding: string; data: string; interpretation: string }[];
  content_growth: {
    word_counts: Record<string, number>;
    growth_rate: string;
    major_expansion_periods: { period: string; growth: string; note: string }[];
  };
}

export function WikiResearchClient() {
  const [data, setData] = useState<CompleteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "phrases" | "timeline">("overview");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.seobandwagon.dev/public/research/complete_link_analysis.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-pink border-t-transparent rounded-full mx-auto" /></div>;
  }

  if (!data) {
    return <div className="container mx-auto px-4 py-20 text-center text-slate-400">Failed to load analysis data</div>;
  }

  const years = data.phrase_analysis?.years || [];
  const maxLinks = Math.max(...Object.values(data.summary.link_counts_by_year));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wikipedia SEO Page Analysis</h1>
        <p className="text-slate-400">Complete historical analysis • {data.summary.total_unique_links} unique external links • 2004-2024</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700 pb-4">
        {[
          { id: "overview", label: "Key Findings", icon: BookOpen },
          { id: "links", label: "Link Changes", icon: Link2 },
          { id: "phrases", label: "Term Evolution", icon: Search },
          { id: "timeline", label: "Year Details", icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === id ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard icon={Link2} label="Unique Links" value={data.summary.total_unique_links.toString()} />
            <StatCard icon={Clock} label="Analysis Period" value="2004-2024" />
            <StatCard icon={TrendingUp} label="Content Growth" value={data.content_growth?.growth_rate?.split(" ")[0] || "681%"} />
            <StatCard icon={BarChart3} label="Snapshots" value="11" />
          </div>

          {/* Key Observations */}
          <div className="rounded-xl bg-gradient-to-r from-pink/10 to-purple-500/10 border border-pink/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink" />Key Research Findings
            </h3>
            <div className="grid gap-4">
              {data.observations?.map((obs, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-pink">
                  <h4 className="font-semibold text-white mb-2">{obs.finding}</h4>
                  <p className="text-sm text-slate-300 font-mono mb-2">{obs.data}</p>
                  <p className="text-sm text-slate-400 italic">{obs.interpretation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Link Count Chart */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">External Link Count Over Time</h3>
            <div className="flex items-end gap-1 h-48">
              {Object.entries(data.summary.link_counts_by_year).map(([year, count]) => (
                <div key={year} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-pink to-purple-500 rounded-t transition-all hover:from-pink/80"
                    style={{ height: `${(count / maxLinks) * 100}%`, minHeight: count > 0 ? "4px" : "0" }} />
                  <span className="text-xs text-slate-400 mt-2 -rotate-45 origin-top-left">{year}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-8 text-xs text-slate-500">
              <span>1 link (2004)</span>
              <span>{data.summary.link_counts_by_year["2024"]} links (2024)</span>
            </div>
          </div>

          {/* Top Domains */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Most Cited Domains (All Time)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {data.domain_analysis?.top_domains?.slice(0, 16).map((d, i) => (
                <div key={d.domain} className="flex items-center gap-3 py-2 px-3 bg-slate-900/50 rounded">
                  <span className="text-slate-500 w-5 text-right">{i + 1}.</span>
                  <span className="flex-1 text-slate-300 truncate">{d.domain}</span>
                  <span className="text-pink font-bold">{d.total_citations}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "links" && (
        <div className="space-y-6">
          <p className="text-slate-400">Click a year to see which links were added and removed.</p>
          <div className="flex flex-wrap gap-2">
            {data.year_by_year?.map(y => (
              <button key={y.year} onClick={() => setSelectedYear(selectedYear === y.year ? null : y.year)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedYear === y.year ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                {y.year} <span className="text-xs opacity-70">({y.total_external_links})</span>
              </button>
            ))}
          </div>

          {selectedYear && (() => {
            const yearData = data.year_by_year?.find(y => y.year === selectedYear);
            if (!yearData) return null;
            return (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
                  <h4 className="font-semibold text-green-400 mb-3">+ Added ({yearData.added?.length || 0})</h4>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {yearData.added?.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-slate-400 hover:text-white truncate">{url}</a>
                    ))}
                    {(!yearData.added || yearData.added.length === 0) && <p className="text-slate-500 text-sm">No new links added</p>}
                  </div>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                  <h4 className="font-semibold text-red-400 mb-3">− Removed ({yearData.removed?.length || 0})</h4>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {yearData.removed?.map((url, i) => (
                      <span key={i} className="block text-xs text-slate-500 truncate">{url}</span>
                    ))}
                    {(!yearData.removed || yearData.removed.length === 0) && <p className="text-slate-500 text-sm">No links removed</p>}
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedYear && (() => {
            const yearData = data.year_by_year?.find(y => y.year === selectedYear);
            if (!yearData) return null;
            return (
              <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
                <h4 className="font-semibold text-white mb-3">All External Links in {selectedYear} ({yearData.all_links?.length || 0})</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {yearData.all_links?.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-slate-400 hover:text-pink truncate">{url}</a>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "phrases" && data.phrase_analysis && (
        <div className="space-y-6">
          <p className="text-slate-400">Track how SEO terminology evolved on Wikipedia over 20 years.</p>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase sticky left-0 bg-slate-900">Term</th>
                  {years.map(y => <th key={y} className="text-right py-3 px-2 text-xs font-medium text-slate-400">{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.phrase_analysis.phrases || {}).map(([phrase, counts]) => (
                  <tr key={phrase} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-4 text-slate-300 font-medium sticky left-0 bg-slate-800/90">{phrase}</td>
                    {years.map(y => {
                      const count = counts[y.toString()] || 0;
                      return (
                        <td key={y} className="text-right py-2 px-2">
                          <span className={count > 0 ? count > 10 ? "text-pink font-bold" : "text-green-400" : "text-slate-600"}>{count}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="space-y-6">
          <p className="text-slate-400">Content growth and expansion periods.</p>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Word Count Over Time</h3>
            <div className="space-y-3">
              {Object.entries(data.content_growth?.word_counts || {}).map(([year, words]) => (
                <div key={year} className="flex items-center gap-4">
                  <span className="w-12 text-slate-400">{year}</span>
                  <div className="flex-1 bg-slate-700 rounded h-6 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink to-purple-500"
                      style={{ width: `${(words / 6200) * 100}%` }} />
                  </div>
                  <span className="w-20 text-right text-slate-300">{words.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Major Expansion Periods</h3>
            <div className="space-y-4">
              {data.content_growth?.major_expansion_periods?.map((p, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-pink font-bold w-24">{p.period}</span>
                  <span className="text-green-400 font-mono w-16">{p.growth}</span>
                  <span className="text-slate-400">{p.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-slate-500 mt-8">
        Analysis generated {data.generated} • Wayback Machine CDX API • {data.summary.total_unique_links} unique external links catalogued
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2"><Icon className="w-4 h-4" /><span className="text-sm">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
