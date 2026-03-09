"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Zap } from "lucide-react";

export default function ProspectIntakePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/prospect/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to capture prospect");
      }

      const { domain } = await res.json();
      router.push(`/dashboard/prospect/${domain}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-16 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-pink/10 border border-pink/30 rounded-full px-4 py-1.5 mb-6">
          <Zap className="h-3.5 w-3.5 text-pink" />
          <span className="text-pink text-xs font-medium tracking-wide uppercase">Browser Extension Simulator</span>
        </div>
        <h1 className="font-heading text-5xl text-[#F5F5F5] mb-3">Prospect Capture</h1>
        <p className="text-[#F5F5F5]/60 text-base">
          Enter a prospect&apos;s website URL to generate their analysis report.
        </p>
      </div>

      <div className="bg-[#000022] border border-pink/20 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#F5F5F5]/70 text-sm font-medium mb-2">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/30" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-[#F5F5F5]/5 border border-pink/20 rounded-xl pl-11 pr-4 py-3.5 text-[#F5F5F5] placeholder:text-[#F5F5F5]/25 focus:outline-none focus:border-pink/60 focus:bg-[#F5F5F5]/8 transition-colors text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full bg-pink hover:bg-pink/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Capturing prospect...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate Prospect Report
              </>
            )}
          </button>
        </form>

        {/* Quick links to existing prospects */}
        <div className="mt-8 pt-6 border-t border-pink/10">
          <p className="text-[#F5F5F5]/40 text-xs uppercase tracking-wider mb-3">Existing Prospects</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "redfoxsafetyproducts.com",
              "robertforce.com",
              "duboislaw.net",
              "amandadubois.com",
            ].map((d) => (
              <button
                key={d}
                onClick={() => router.push(`/dashboard/prospect/${d}`)}
                className="text-left px-3 py-2 rounded-lg bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 border border-pink/10 hover:border-pink/30 transition-colors"
              >
                <span className="text-[#F5F5F5]/70 text-xs truncate block">{d}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
