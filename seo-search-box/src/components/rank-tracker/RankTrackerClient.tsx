"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Star,
} from "lucide-react";
import { RankHistoryChart } from "./RankHistoryChart";

interface TopResult {
  position: number;
  domain: string;
  url: string;
  title: string;
}

interface RankResult {
  keyword: string;
  domain: string;
  position: number | null;
  url: string | null;
  totalResults: number;
  topResults: TopResult[];
  checkedAt: string;
}

interface HistoryEntry {
  position: number | null;
  url: string | null;
  recordedAt: string;
}

interface TrackedKeyword {
  id: string;
  keyword: string;
  domain: string;
  lastPosition: number | null;
  lastCheckedAt: string | null;
}

export function RankTrackerClient() {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RankResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tracked, setTracked] = useState<TrackedKeyword[]>([]);
  const [loadingTracked, setLoadingTracked] = useState(true);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);

  // Load tracked keywords on mount
  const loadTracked = useCallback(async () => {
    try {
      const res = await fetch("/api/rank-track/tracked");
      if (res.ok) {
        const data = await res.json();
        setTracked(data.tracked || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingTracked(false);
    }
  }, []);

  useEffect(() => {
    loadTracked();
  }, [loadTracked]);

  async function checkRank(kw: string, dom: string, track: boolean = false) {
    setLoading(true);
    setError(null);
    setResult(null);
    setHistory([]);
    setKeyword(kw);
    setDomain(dom);

    try {
      const res = await fetch("/api/rank-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: kw.trim(),
          domain: dom.trim(),
          track,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Rank check failed");
      }

      const data: RankResult = await res.json();
      setResult(data);

      // Fetch history
      const histRes = await fetch(
        `/api/rank-track/history?keyword=${encodeURIComponent(data.keyword)}&domain=${encodeURIComponent(data.domain)}`
      );
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.history || []);
      }

      // Refresh tracked list
      await loadTracked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || !domain.trim()) return;
    await checkRank(keyword, domain);
  }

  async function handleTrack() {
    if (!result) return;
    try {
      await fetch("/api/rank-track/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: result.keyword,
          domain: result.domain,
          position: result.position,
        }),
      });
      await loadTracked();
    } catch {
      // Silently fail
    }
  }

  async function handleRemoveTracked(id: string) {
    try {
      await fetch(`/api/rank-track/tracked?id=${id}`, { method: "DELETE" });
      setTracked((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // Silently fail
    }
  }

  async function handleRecheck(tk: TrackedKeyword) {
    setRecheckingId(tk.id);
    try {
      const res = await fetch("/api/rank-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: tk.keyword,
          domain: tk.domain,
          track: true,
        }),
      });
      if (res.ok) {
        await loadTracked();
      }
    } catch {
      // Silently fail
    } finally {
      setRecheckingId(null);
    }
  }

  async function handleRecheckAll() {
    for (const tk of tracked) {
      await handleRecheck(tk);
    }
  }

  const isAlreadyTracked =
    result &&
    tracked.some(
      (t) => t.keyword === result.keyword && t.domain === result.domain
    );

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Enter keyword (e.g. seo tools)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 px-4 py-3 text-[#F5F5F5] placeholder-[#F5F5F5]/30 focus:outline-none focus:border-pink transition-colors"
        />
        <input
          type="text"
          placeholder="Enter domain (e.g. seobandwagon.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 rounded-lg bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 px-4 py-3 text-[#F5F5F5] placeholder-[#F5F5F5]/30 focus:outline-none focus:border-pink transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !keyword.trim() || !domain.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-pink px-6 py-3 font-heading text-lg tracking-wider text-[#F5F5F5] transition-all hover:bg-pink/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          CHECK RANK
        </button>
      </form>

      {/* Tracked Keywords */}
      {!loadingTracked && tracked.length > 0 && (
        <div className="rounded-xl bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl text-[#F5F5F5] tracking-wider flex items-center gap-2">
              <Star className="h-5 w-5 text-pink" />
              TRACKED KEYWORDS
            </h3>
            <button
              onClick={handleRecheckAll}
              disabled={recheckingId !== null}
              className="flex items-center gap-1 text-sm text-pink/70 hover:text-pink transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${recheckingId ? "animate-spin" : ""}`}
              />
              Recheck All
            </button>
          </div>
          <div className="space-y-2">
            {tracked.map((tk) => (
              <div
                key={tk.id}
                className="flex items-center gap-4 rounded-lg bg-[#F5F5F5]/3 hover:bg-[#F5F5F5]/5 p-3 transition-colors"
              >
                {/* Position */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-heading text-lg ${
                    tk.lastPosition === null
                      ? "border-[#F5F5F5]/20 text-[#F5F5F5]/40"
                      : tk.lastPosition <= 3
                      ? "border-green-400 text-green-400"
                      : tk.lastPosition <= 10
                      ? "border-yellow-400 text-yellow-400"
                      : tk.lastPosition <= 20
                      ? "border-orange-400 text-orange-400"
                      : "border-red-400 text-red-400"
                  }`}
                >
                  {tk.lastPosition ?? "—"}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#F5F5F5]/90 text-sm font-medium truncate">
                    {tk.keyword}
                  </p>
                  <p className="text-[#F5F5F5]/40 text-xs truncate">
                    {tk.domain}
                    {tk.lastCheckedAt && (
                      <span className="ml-2">
                        · {new Date(tk.lastCheckedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => checkRank(tk.keyword, tk.domain, false)}
                    className="p-2 text-[#F5F5F5]/40 hover:text-[#F5F5F5] transition-colors"
                    title="View details"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRecheck(tk)}
                    disabled={recheckingId === tk.id}
                    className="p-2 text-[#F5F5F5]/40 hover:text-pink transition-colors disabled:opacity-50"
                    title="Recheck rank"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        recheckingId === tk.id ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleRemoveTracked(tk.id)}
                    className="p-2 text-[#F5F5F5]/40 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
          <h3 className="text-lg font-medium text-red-400 mb-2">Error</h3>
          <p className="text-slate-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink mx-auto mb-3" />
          <p className="text-[#F5F5F5]/60">Checking Google rankings...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Position Card */}
          <div className="rounded-xl bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${
                    result.position === null
                      ? "border-[#F5F5F5]/20 text-[#F5F5F5]/40"
                      : result.position <= 3
                      ? "border-green-400 text-green-400"
                      : result.position <= 10
                      ? "border-yellow-400 text-yellow-400"
                      : result.position <= 20
                      ? "border-orange-400 text-orange-400"
                      : "border-red-400 text-red-400"
                  }`}
                >
                  <span className="font-heading text-3xl">
                    {result.position ?? "—"}
                  </span>
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="font-heading text-2xl text-[#F5F5F5] tracking-wider mb-1">
                  {result.position
                    ? `#${result.position} in Google`
                    : "Not Found in Top 100"}
                </h2>
                <p className="text-[#F5F5F5]/60">
                  <span className="text-pink font-medium">{result.domain}</span>{" "}
                  for &ldquo;
                  <span className="text-[#F5F5F5]/80">{result.keyword}</span>
                  &rdquo;
                </p>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm text-pink/70 hover:text-pink transition-colors"
                  >
                    {result.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-center">
                  <p className="text-xs text-[#F5F5F5]/40 uppercase tracking-wider">
                    Checked
                  </p>
                  <p className="text-sm text-[#F5F5F5]/60">
                    {new Date(result.checkedAt).toLocaleString()}
                  </p>
                </div>
                {!isAlreadyTracked && (
                  <button
                    onClick={handleTrack}
                    className="flex items-center gap-1 rounded-lg bg-pink/20 border border-pink/30 px-3 py-1.5 text-sm text-pink hover:bg-pink/30 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Track Keyword
                  </button>
                )}
                {isAlreadyTracked && (
                  <span className="flex items-center gap-1 text-sm text-green-400/70">
                    <Star className="h-4 w-4" />
                    Tracking
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* History Chart */}
          {history.length > 1 && (
            <div className="rounded-xl bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 p-6">
              <h3 className="font-heading text-xl text-[#F5F5F5] tracking-wider mb-4">
                POSITION HISTORY
              </h3>
              <RankHistoryChart history={history} />
            </div>
          )}

          {/* Top 10 SERP */}
          <div className="rounded-xl bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 p-6">
            <h3 className="font-heading text-xl text-[#F5F5F5] tracking-wider mb-4">
              TOP 10 RESULTS
            </h3>
            <div className="space-y-3">
              {result.topResults.map((item) => (
                <div
                  key={item.position}
                  className={`flex items-start gap-4 rounded-lg p-3 transition-colors ${
                    item.domain
                      .replace(/^www\./, "")
                      .toLowerCase() === result.domain
                      ? "bg-pink/10 border border-pink/30"
                      : "bg-[#F5F5F5]/3 hover:bg-[#F5F5F5]/5"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 font-heading text-lg w-8 text-center ${
                      item.position <= 3
                        ? "text-green-400"
                        : "text-[#F5F5F5]/40"
                    }`}
                  >
                    {item.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[#F5F5F5]/90 text-sm truncate">
                      {item.title}
                    </p>
                    <p className="text-[#F5F5F5]/40 text-xs truncate">
                      {item.domain}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
