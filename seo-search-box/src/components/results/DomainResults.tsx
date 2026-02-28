"use client";

import {
  Globe,
  Link2,
  Users,
  TrendingUp,
  Shield,
  Gauge,
  FileText,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { cn, formatNumber, getScoreColor, formatRelativeDate } from "@/lib/utils";
import { LighthouseGauge } from "../charts/LighthouseGauge";
import { SaveSearchButton } from "./SaveSearchButton";

interface DomainResultsProps {
  data: {
    domain: DomainData;
    backlinks: BacklinksData;
    rankedKeywords: RankedKeyword[];
    competitors: Competitor[];
    lighthouse: LighthouseData | null;
    pageAnalysis: PageAnalysisData | null;
    whois: WhoisData | null;
  };
  query: string;
  searchId?: string | null;
}

interface DomainData {
  domain: string;
  domainRank: number | null;
  organicTraffic: number | null;
  organicKeywords: number | null;
}

interface BacklinksData {
  total: number;
  referringDomains: number;
  dofollow: number;
  nofollow: number;
}

interface RankedKeyword {
  keyword: string;
  position: number;
  searchVolume: number | null;
  url: string;
}

interface Competitor {
  domain: string;
  intersections: number;
  avgPosition: number;
}

interface LighthouseData {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface PageAnalysisData {
  title: string;
  metaDescription: string;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
}

interface WhoisData {
  registrar: string;
  createdDate: string;
  expiryDate: string;
  nameServers: string[];
}

export function DomainResults({ data, query, searchId }: DomainResultsProps) {
  const { domain, backlinks, rankedKeywords, competitors, lighthouse, pageAnalysis, whois } = data;

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <SaveSearchButton searchId={searchId ?? null} query={query} />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="Domain Rank"
          value={domain.domainRank?.toString() || "N/A"}
          color="text-purple-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Organic Traffic"
          value={formatNumber(domain.organicTraffic)}
          subtext="monthly visits"
          color="text-blue-400"
        />
        <StatCard
          icon={Link2}
          label="Backlinks"
          value={formatNumber(backlinks.total)}
          subtext={`${formatNumber(backlinks.referringDomains)} domains`}
          color="text-green-400"
        />
        <StatCard
          icon={FileText}
          label="Ranked Keywords"
          value={formatNumber(domain.organicKeywords)}
          color="text-yellow-400"
        />
      </div>

      {/* Lighthouse Scores */}
      {lighthouse && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-orange-400" />
            Lighthouse Scores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <LighthouseGauge label="Performance" score={lighthouse.performance} />
            <LighthouseGauge label="Accessibility" score={lighthouse.accessibility} />
            <LighthouseGauge label="Best Practices" score={lighthouse.bestPractices} />
            <LighthouseGauge label="SEO" score={lighthouse.seo} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ranked Keywords */}
        <div className="md:col-span-2 rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Ranked Keywords ({rankedKeywords.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {rankedKeywords.length > 0 ? (
              rankedKeywords.slice(0, 20).map((kw, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded text-sm font-medium",
                        kw.position <= 3
                          ? "bg-green-500/20 text-green-400"
                          : kw.position <= 10
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-700 text-slate-400"
                      )}
                    >
                      #{kw.position}
                    </span>
                    <span className="text-white">{kw.keyword}</span>
                  </div>
                  <span className="text-slate-400 text-sm">
                    {formatNumber(kw.searchVolume)} vol
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No ranked keywords found</p>
            )}
          </div>
        </div>

        {/* Competitors */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Competitors
          </h3>
          <div className="space-y-3">
            {competitors.length > 0 ? (
              competitors.slice(0, 10).map((comp, index) => (
                <div
                  key={index}
                  className="py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={`https://${comp.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {comp.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-xs text-slate-500">
                      {comp.intersections} shared
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No competitors found</p>
            )}
          </div>
        </div>
      </div>

      {/* Page Analysis */}
      {pageAnalysis && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Page Analysis
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Title</label>
                <p className="text-white">{pageAnalysis.title || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Meta Description</label>
                <p className="text-slate-300 text-sm">
                  {pageAnalysis.metaDescription || "N/A"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MiniStat label="Word Count" value={formatNumber(pageAnalysis.wordCount)} />
              <MiniStat label="Internal Links" value={formatNumber(pageAnalysis.internalLinks)} />
              <MiniStat label="External Links" value={formatNumber(pageAnalysis.externalLinks)} />
              <MiniStat label="Images" value={formatNumber(pageAnalysis.images)} />
            </div>
          </div>
        </div>
      )}

      {/* WHOIS Data */}
      {whois && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-400" />
            WHOIS Information
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-slate-400">Registrar</label>
              <p className="text-white">{whois.registrar || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Created</label>
              <p className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                {whois.createdDate ? formatRelativeDate(whois.createdDate) : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Expires</label>
              <p className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                {whois.expiryDate ? formatRelativeDate(whois.expiryDate) : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Name Servers</label>
              <p className="text-slate-300 text-sm">
                {whois.nameServers?.length || 0} configured
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backlink Breakdown */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-green-400" />
          Backlink Profile
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <MiniStat label="Total Backlinks" value={formatNumber(backlinks.total)} />
          <MiniStat label="Referring Domains" value={formatNumber(backlinks.referringDomains)} />
          <MiniStat label="Dofollow" value={formatNumber(backlinks.dofollow)} color="text-green-400" />
          <MiniStat label="Nofollow" value={formatNumber(backlinks.nofollow)} color="text-yellow-400" />
        </div>
      </div>
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
  icon: typeof Globe;
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

function MiniStat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <p className={cn("text-lg font-semibold", color)}>{value}</p>
    </div>
  );
}
