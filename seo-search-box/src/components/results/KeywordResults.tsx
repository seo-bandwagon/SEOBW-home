"use client";

import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Lightbulb,
  Search,
  ExternalLink,
} from "lucide-react";
import { SaveSearchButton } from "./SaveSearchButton";
import {
  cn,
  formatNumber,
  formatCurrency,
  getScoreColor,
  getCompetitionLabel,
  getIntentLabel,
  getIntentColor,
} from "@/lib/utils";

interface KeywordResultsProps {
  data: {
    keyword: KeywordData;
    relatedKeywords: RelatedKeyword[];
    autocomplete: string[];
    intent: IntentData | null;
    topUrls: TopUrl[];
  };
  query: string;
  searchId?: string | null;
}

interface KeywordData {
  keyword: string;
  searchVolume: number | null;
  cpcLow: number | null;
  cpcHigh: number | null;
  cpcAvg: number | null;
  competition: number | null;
  difficulty: number | null;
  monthlySearches: Array<{ year: number; month: number; search_volume: number }>;
}

interface RelatedKeyword {
  keyword: string;
  searchVolume: number | null;
  cpc: number | null;
  type: string;
}

interface IntentData {
  label: string;
  probability: number;
}

interface TopUrl {
  url: string;
  domain: string;
  title: string;
  position: number;
}

export function KeywordResults({ data, query, searchId }: KeywordResultsProps) {
  const { keyword, relatedKeywords, autocomplete, intent, topUrls } = data;

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <SaveSearchButton searchId={searchId ?? null} query={query} />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Search Volume"
          value={formatNumber(keyword.searchVolume)}
          subtext="monthly"
          color="text-blue-400"
        />
        <StatCard
          icon={DollarSign}
          label="Avg. CPC"
          value={formatCurrency(keyword.cpcAvg)}
          subtext={keyword.cpcLow && keyword.cpcHigh ? `${formatCurrency(keyword.cpcLow)} - ${formatCurrency(keyword.cpcHigh)}` : undefined}
          color="text-green-400"
        />
        <StatCard
          icon={Target}
          label="Competition"
          value={getCompetitionLabel(keyword.competition)}
          subtext={keyword.competition ? `${(keyword.competition * 100).toFixed(0)}%` : undefined}
          color="text-yellow-400"
        />
        <StatCard
          icon={BarChart3}
          label="Difficulty"
          value={keyword.difficulty?.toString() || "N/A"}
          subtext="out of 100"
          color={getScoreColor(100 - (keyword.difficulty || 0))}
        />
      </div>

      {/* Search Intent */}
      {intent && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Search Intent
          </h3>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                getIntentColor(intent.label)
              )}
            >
              {getIntentLabel(intent.label)}
            </span>
            <span className="text-slate-400">
              {(intent.probability * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Related Keywords */}
        <div className="md:col-span-2 rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Related Keywords ({relatedKeywords.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {relatedKeywords.length > 0 ? (
              relatedKeywords.map((kw, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white">{kw.keyword}</span>
                    {kw.type && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                        {kw.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">
                      {formatNumber(kw.searchVolume)} vol
                    </span>
                    <span className="text-green-400">
                      {formatCurrency(kw.cpc)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No related keywords found</p>
            )}
          </div>
        </div>

        {/* Autocomplete Suggestions */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" />
            Autocomplete
          </h3>
          <div className="space-y-2">
            {autocomplete.length > 0 ? (
              autocomplete.slice(0, 10).map((suggestion, index) => (
                <div
                  key={index}
                  className="text-slate-300 py-1 border-b border-slate-700/50 last:border-0"
                >
                  {suggestion}
                </div>
              ))
            ) : (
              <p className="text-slate-400">No suggestions available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Ranking URLs */}
      {topUrls && topUrls.length > 0 && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Ranking Pages
          </h3>
          <div className="space-y-3">
            {topUrls.slice(0, 10).map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 py-3 border-b border-slate-700 last:border-0"
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300 text-sm font-medium">
                  {item.position}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                  >
                    {item.title || item.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <p className="text-sm text-slate-500 truncate">{item.domain}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {keyword.monthlySearches && keyword.monthlySearches.length > 0 && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Search Volume Trend (12 months)
          </h3>
          <div className="flex items-end gap-1 h-32">
            {keyword.monthlySearches.slice(-12).map((month, index) => {
              const maxVolume = Math.max(...keyword.monthlySearches.map((m) => m.search_volume));
              const height = maxVolume > 0 ? (month.search_volume / maxVolume) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-blue-500/50 rounded-t hover:bg-blue-500/70 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${month.month}/${month.year}: ${formatNumber(month.search_volume)}`}
                  />
                  <span className="text-xs text-slate-500">{month.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      {subtext && <p className="text-sm text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}
