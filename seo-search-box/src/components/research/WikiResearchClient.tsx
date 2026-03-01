"use client";

import { useState, useEffect } from "react";
import { BarChart3, ExternalLink, Link2, Clock, TrendingUp, History, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  pages: { seo: PageEvolution; digital_marketing: PageEvolution };
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

interface LinkAnalysis {
  generated: string;
  seo_page: {
    title: string;
    wikipedia_url: string;
    first_archived: string;
    total_wayback_snapshots: number;
    link_timeline: { year: number; external_links: number; added?: number; removed?: number }[];
    top_domains: { domain: string; citations: number; category: string; first_seen: number; status: string; note?: string }[];
    link_categories: Record<string, number>;
    notable_events: { year: number; event: string }[];
  };
  key_findings: { finding: string; detail: string; implication: string }[];
}

export function WikiResearchClient() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [evolution, setEvolution] = useState<EvolutionData | null>(null);
  const [linkAnalysis, setLinkAnalysis] = useState<LinkAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "seo" | "dm">("overview");
  const [sortBy, setSortBy] = useState<"external_links" | "total_snapshots" | "serp_position">("external_links");

  useEffect(() => {
    Promise.all([
      fetch("https://api.seobandwagon.dev/public/research/wiki-pages.json").then(r => r.json()),
      fetch("https://api.seobandwagon.dev/public/research/evolution_analysis.json").then(r => r.json()),
      fetch("https://api.seobandwagon.dev/public/research/comprehensive_link_analysis.json").then(r => r.json())
    ]).then(([pagesData, evoData, linksData]) => {
      setPages(pagesData);
      setEvolution(evoData);
      setLinkAnalysis(linksData);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wikipedia Link Analysis</h1>
        <p className="text-slate-400">Historical analysis using Wayback Machine • 4,550+ snapshots analyzed</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700 pb-4">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "links", label: "Link Analysis", icon: Link2 },
          { id: "seo", label: "SEO History", icon: History },
          { id: "dm", label: "Digital Marketing", icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === id ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Link2} label="Internal Links" value={totalInternal.toLocaleString()} />
            <StatCard icon={ExternalLink} label="External Links" value={totalExternal.toLocaleString()} />
            <StatCard icon={Clock} label="Wayback Snapshots" value={totalSnapshots.toLocaleString()} />
            <StatCard icon={BarChart3} label="Pages Analyzed" value={pages.length.toString()} />
          </div>

          {linkAnalysis && (
            <div className="rounded-xl bg-gradient-to-r from-pink/10 to-purple-500/10 border border-pink/30 p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink" />
                Key Findings
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {linkAnalysis.key_findings.map((f, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-1">{f.finding}</h4>
                    <p className="text-sm text-slate-400 mb-2">{f.detail}</p>
                    <p className="text-xs text-pink">→ {f.implication}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            {["external_links", "total_snapshots", "serp_position"].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort as typeof sortBy)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === sort ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                By {sort.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Page</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Keyword</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">SERP</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">External</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">Snapshots</th>
                </tr>
              </thead>
              <tbody>
                {sortedPages.map((page) => (
                  <tr key={page.page} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <a href={`https://en.wikipedia.org/wiki/${page.page}`} target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">
                        {page.page.replace(/_/g, " ")}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{page.keyword}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        page.serp_position === 1 ? "bg-green-500/20 text-green-400" :
                        page.serp_position <= 3 ? "bg-blue-500/20 text-blue-400" :
                        page.serp_position <= 10 ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400"
                      }`}>#{page.serp_position}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-slate-300">{page.external_links}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-300">{page.total_snapshots || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "links" && linkAnalysis && (
        <LinkAnalysisView data={linkAnalysis} />
      )}

      {activeTab === "seo" && evolution && (
        <PageHistoryView data={evolution.pages.seo} />
      )}

      {activeTab === "dm" && evolution && (
        <PageHistoryView data={evolution.pages.digital_marketing} />
      )}

      <p className="text-center text-sm text-slate-500 mt-8">
        Data: DataForSEO SERP API + Wayback Machine CDX • Generated {linkAnalysis?.generated || "2026-03-01"}
      </p>
    </div>
  );
}

function LinkAnalysisView({ data }: { data: LinkAnalysis }) {
  const seo = data.seo_page;
  const maxLinks = Math.max(...seo.link_timeline.map(t => t.external_links));

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="First Archived" value={seo.first_archived} />
        <StatCard icon={History} label="Total Snapshots" value={seo.total_wayback_snapshots.toLocaleString()} />
        <StatCard icon={Link2} label="Current Links" value={seo.link_timeline[seo.link_timeline.length - 1]?.external_links?.toString() || "0"} />
      </div>

      {/* Link Timeline Chart */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">External Link Count Over Time</h3>
        <div className="flex items-end gap-2 h-48">
          {seo.link_timeline.map((t) => (
            <div key={t.year} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-40">
                {t.added && t.added > 0 && (
                  <span className="text-xs text-green-400 mb-1">+{t.added}</span>
                )}
                {t.removed && t.removed > 0 && (
                  <span className="text-xs text-red-400 mb-1">-{t.removed}</span>
                )}
                <div 
                  className="w-full bg-gradient-to-t from-pink to-purple-500 rounded-t"
                  style={{ height: `${(t.external_links / maxLinks) * 100}%`, minHeight: t.external_links > 0 ? "8px" : "0" }}
                />
              </div>
              <span className="text-xs text-slate-400 mt-2">{t.year}</span>
              <span className="text-xs text-slate-500">{t.external_links}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Domains */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Most Cited Domains (All Time)</h3>
        <div className="space-y-3">
          {seo.top_domains.map((d, i) => (
            <div key={d.domain} className="flex items-center gap-4">
              <span className="text-slate-500 w-6">{i + 1}.</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{d.domain}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    d.category === "SEO Industry" ? "bg-pink/20 text-pink" :
                    d.category === "Search Engine" ? "bg-blue-500/20 text-blue-400" :
                    d.category === "Academic" ? "bg-purple-500/20 text-purple-400" :
                    d.category === "News" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-600 text-slate-300"
                  }`}>{d.category}</span>
                  {d.status !== "active" && (
                    <span className="text-xs text-slate-500">({d.status})</span>
                  )}
                </div>
                {d.note && <p className="text-xs text-slate-500">{d.note}</p>}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white">{d.citations}</span>
                <span className="text-xs text-slate-500 block">since {d.first_seen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notable Events Timeline */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notable Citation Events</h3>
        <div className="space-y-4">
          {seo.notable_events.map((e, i) => (
            <div key={i} className="flex gap-4">
              <div className="text-pink font-bold w-12">{e.year}</div>
              <div className="flex-1 text-slate-300">{e.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Link Categories */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Citations by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(seo.link_categories).map(([cat, count]) => (
            <div key={cat} className="text-center">
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-sm text-slate-400">{cat.replace(/_/g, " ")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageHistoryView({ data }: { data: PageEvolution }) {
  const maxWords = Math.max(...data.growth.map(g => g.words));
  
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="First Captured" value={data.first_captured} />
        <StatCard icon={History} label="Total Snapshots" value={data.total_snapshots.toLocaleString()} />
        <StatCard icon={TrendingUp} label="Word Growth" value={`${data.growth[0]?.words || 0} → ${data.growth[data.growth.length - 1]?.words || 0}`} />
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Content Growth (Word Count)</h3>
        <div className="flex items-end gap-2 h-48">
          {data.growth.map((g) => (
            <div key={g.year} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gradient-to-t from-pink to-purple-500 rounded-t" style={{ height: `${(g.words / maxWords) * 100}%` }} />
              <span className="text-xs text-slate-400 mt-2">{g.year}</span>
              <span className="text-xs text-slate-500">{g.words.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

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
