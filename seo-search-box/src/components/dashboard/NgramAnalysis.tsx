"use client";

import { useState, useEffect } from "react";
import { ExternalLink, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface NgramData {
  page: string;
  years: number[];
  snapshots: Record<string, { year: number; url: string; word_count: number }>;
  term_evolution: {
    unigrams: Record<string, Record<number, number>>;
    bigrams: Record<string, Record<number, number>>;
    trigrams: Record<string, Record<number, number>>;
  };
  top_terms_by_year: Record<string, {
    unigrams: [string, number][];
    bigrams: [string, number][];
    trigrams: [string, number][];
  }>;
}

export function NgramAnalysis() {
  const [data, setData] = useState<NgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [ngramType, setNgramType] = useState<"unigrams" | "bigrams" | "trigrams">("bigrams");

  useEffect(() => {
    fetch("https://api.seobandwagon.dev/public/research/seo_ngram_analysis.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;
  if (!data) return <div className="text-slate-400">Failed to load n-gram data</div>;

  const years = data.years;
  const maxWordCount = Math.max(...Object.values(data.snapshots).map(s => s.word_count));

  return (
    <div className="space-y-8">
      {/* Snapshot Timeline with Links */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pink" />
          Content Size Over Time (Click to view snapshot)
        </h3>
        <div className="flex items-end gap-2 h-48">
          {years.map(year => {
            const snapshot = data.snapshots[year.toString()];
            const height = (snapshot?.word_count || 0) / maxWordCount * 100;
            return (
              <a
                key={year}
                href={snapshot?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center group cursor-pointer"
              >
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <span className="text-xs text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {snapshot?.word_count?.toLocaleString()} words
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-pink to-purple-500 rounded-t group-hover:from-pink/80 transition-all"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  />
                </div>
                <span className="text-xs text-slate-400 mt-2 group-hover:text-pink transition-colors">{year}</span>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-pink transition-colors" />
              </a>
            );
          })}
        </div>
      </div>

      {/* N-gram Type Selector */}
      <div className="flex gap-2">
        {(["unigrams", "bigrams", "trigrams"] as const).map(type => (
          <button
            key={type}
            onClick={() => setNgramType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              ngramType === type ? "bg-pink text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {type === "unigrams" ? "Single Words" : type === "bigrams" ? "2-Word Phrases" : "3-Word Phrases"}
          </button>
        ))}
      </div>

      {/* Term Evolution Table */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          {ngramType === "unigrams" ? "Word" : "Phrase"} Frequency Across Snapshots
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left py-2 px-3 sticky left-0 bg-slate-800">Term</th>
              {years.map(y => (
                <th key={y} className="text-right py-2 px-2">
                  <a 
                    href={data.snapshots[y.toString()]?.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-pink"
                  >
                    {y}
                  </a>
                </th>
              ))}
              <th className="text-right py-2 px-3">Trend</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.term_evolution[ngramType] || {})
              .sort((a, b) => {
                const aTotal = Object.values(a[1]).reduce((sum, n) => sum + n, 0);
                const bTotal = Object.values(b[1]).reduce((sum, n) => sum + n, 0);
                return bTotal - aTotal;
              })
              .map(([term, counts]) => {
                const values = years.map(y => counts[y] || 0);
                const firstHalf = values.slice(0, 5).reduce((a, b) => a + b, 0);
                const secondHalf = values.slice(5).reduce((a, b) => a + b, 0);
                const trend = secondHalf > firstHalf ? "up" : secondHalf < firstHalf ? "down" : "stable";
                
                return (
                  <tr key={term} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-3 text-slate-300 font-medium sticky left-0 bg-slate-800/90">{term}</td>
                    {years.map(y => {
                      const count = counts[y] || 0;
                      return (
                        <td key={y} className="text-right py-2 px-2">
                          <span className={count > 10 ? "text-pink font-bold" : count > 0 ? "text-green-400" : "text-slate-600"}>
                            {count}
                          </span>
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3">
                      {trend === "up" && <TrendingUp className="w-4 h-4 text-green-400 inline" />}
                      {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400 inline" />}
                      {trend === "stable" && <span className="text-slate-500">—</span>}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Year Details */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Terms by Year</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(selectedYear === y ? null : y)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedYear === y ? "bg-pink text-white" : "bg-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        
        {selectedYear && data.top_terms_by_year[selectedYear.toString()] && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <a 
                href={data.snapshots[selectedYear.toString()]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink hover:underline flex items-center gap-1"
              >
                View {selectedYear} Snapshot <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-500">
                ({data.snapshots[selectedYear.toString()]?.word_count?.toLocaleString()} words)
              </span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Top Words</h4>
                <div className="space-y-1">
                  {data.top_terms_by_year[selectedYear.toString()]?.unigrams?.slice(0, 10).map(([term, count], i) => (
                    <div key={term} className="flex justify-between text-sm">
                      <span className="text-slate-300">{i + 1}. {term}</span>
                      <span className="text-pink">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Top 2-Word Phrases</h4>
                <div className="space-y-1">
                  {data.top_terms_by_year[selectedYear.toString()]?.bigrams?.slice(0, 10).map(([term, count], i) => (
                    <div key={term} className="flex justify-between text-sm">
                      <span className="text-slate-300">{i + 1}. {term}</span>
                      <span className="text-pink">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Top 3-Word Phrases</h4>
                <div className="space-y-1">
                  {data.top_terms_by_year[selectedYear.toString()]?.trigrams?.slice(0, 10).map(([term, count], i) => (
                    <div key={term} className="flex justify-between text-sm">
                      <span className="text-slate-300">{i + 1}. {term}</span>
                      <span className="text-pink">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
