"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

export interface KeywordRow {
  name: string;
  position: number | null;
  volume: number;
  cpc: number | null;
  isForcedBrand?: boolean; // manually injected brand keyword (e.g. person's name)
}

// CTR range by Google organic position
function ctrRange(pos: number): [number, number] {
  if (pos === 1) return [0.25, 0.35];
  if (pos === 2) return [0.18, 0.25];
  if (pos === 3) return [0.12, 0.18];
  if (pos === 4) return [0.08, 0.12];
  if (pos === 5) return [0.06, 0.09];
  if (pos <= 7)  return [0.04, 0.07];
  if (pos <= 10) return [0.03, 0.05];
  if (pos <= 20) return [0.01, 0.03];
  return [0.005, 0.01];
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function positionBg(pos: number): string {
  if (pos <= 3) return "bg-green-500/20 text-green-300";
  if (pos <= 10) return "bg-yellow-500/20 text-yellow-300";
  if (pos <= 20) return "bg-orange-500/20 text-orange-300";
  return "bg-red-500/20 text-red-300";
}

interface Props {
  discoveryKeywords: KeywordRow[];
  brandedKeywords: KeywordRow[];
  isBrandedOnly: boolean;
}

export function ProspectKeywordTabs({ discoveryKeywords, brandedKeywords, isBrandedOnly }: Props) {
  const [tab, setTab] = useState<"discovery" | "branded">("discovery");

  const rows = tab === "discovery" ? discoveryKeywords : brandedKeywords;

  return (
    <div>
      {/* Branded-only alert */}
      {isBrandedOnly && (
        <div className="flex items-start gap-3 bg-orange-400/10 border border-orange-400/30 rounded-xl p-4 mb-5">
          <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
          <p className="text-orange-300 text-sm">
            <span className="font-semibold">You rank for your name, but not for what you sell.</span>{" "}
            All of your current rankings are for branded search terms. When someone searches for your
            product or service without knowing you exist, you&apos;re invisible.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-pink/10">
        <button
          onClick={() => setTab("discovery")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "discovery"
              ? "bg-[#FF1493]/10 text-[#FF1493] border-b-2 border-[#FF1493]"
              : "text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
          }`}
        >
          Discovery Keywords
          {discoveryKeywords.length > 0 && (
            <span className="ml-2 text-xs bg-[#F5F5F5]/10 rounded-full px-1.5 py-0.5">
              {discoveryKeywords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("branded")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "branded"
              ? "bg-[#FF1493]/10 text-[#FF1493] border-b-2 border-[#FF1493]"
              : "text-[#F5F5F5]/40 hover:text-[#F5F5F5]/70"
          }`}
        >
          Branded Terms
          {brandedKeywords.length > 0 && (
            <span className="ml-2 text-xs bg-[#F5F5F5]/10 rounded-full px-1.5 py-0.5">
              {brandedKeywords.length}
            </span>
          )}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-[#F5F5F5]/30 text-sm italic py-4">
          {tab === "discovery"
            ? "No non-branded keywords with search volume found. This is the opportunity."
            : "No branded keyword data available."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink/10">
                <th className="text-left py-2 pr-4 text-[#F5F5F5]/40 font-medium text-xs uppercase tracking-wider">Keyword</th>
                <th className="text-center py-2 px-3 text-[#F5F5F5]/40 font-medium text-xs uppercase tracking-wider">Rank</th>
                <th className="text-right py-2 px-3 text-[#F5F5F5]/40 font-medium text-xs uppercase tracking-wider">Mo. Searches</th>
                {tab === "discovery" && (
                  <>
                    <th className="text-right py-2 px-3 text-[#F5F5F5]/40 font-medium text-xs uppercase tracking-wider">CPC</th>
                    <th className="text-right py-2 pl-3 text-[#F5F5F5]/40 font-medium text-xs uppercase tracking-wider">Est. Clicks/Mo</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((kw, i) => {
                const pos = kw.position;
                const ctr = pos ? ctrRange(pos) : null;
                const clicksLow  = ctr && kw.volume ? Math.round(kw.volume * ctr[0]) : null;
                const clicksHigh = ctr && kw.volume ? Math.round(kw.volume * ctr[1]) : null;

                return (
                  <tr key={i} className="border-b border-pink/5 hover:bg-[#F5F5F5]/2 transition-colors">
                    <td className="py-3 pr-4 text-[#F5F5F5]">{kw.name}</td>
                    <td className="py-3 px-3 text-center">
                      {pos ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${positionBg(pos)}`}>
                          #{pos}
                        </span>
                      ) : (
                        <span className="text-[#F5F5F5]/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-[#F5F5F5]/60">
                      {kw.isForcedBrand && kw.volume === 0
                        ? <span className="text-[#F5F5F5]/30 text-xs italic">&lt;10/mo</span>
                        : kw.volume > 0 ? kw.volume.toLocaleString() : "—"}
                    </td>
                    {tab === "discovery" && (
                      <>
                        <td className="py-3 px-3 text-right text-[#F5F5F5]/60">
                          {kw.cpc && kw.cpc > 0 ? `$${kw.cpc.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          {clicksLow !== null && clicksHigh !== null ? (
                            <span className="text-green-400 font-medium text-xs">
                              {fmt(clicksLow)}–{fmt(clicksHigh)}
                            </span>
                          ) : (
                            <span className="text-[#F5F5F5]/20 text-xs">—</span>
                          )}
                        </td>
                      </>
                    )}
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
