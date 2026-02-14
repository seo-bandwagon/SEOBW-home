"use client";

import { useState } from "react";
import { Navbar } from "@/components/common/Navbar";
import { LocalRankForm, type LocalRankFormData } from "@/components/local-rank/LocalRankForm";
import {
  LocalRankGrid,
  LocalRankStats,
  LocalRankDetails,
} from "@/components/local-rank/LocalRankGrid";
import type { GridScanSummary } from "@/lib/dataforseo";
import { AlertCircle, MapPin } from "lucide-react";

export default function LocalRankPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GridScanSummary | null>(null);

  const handleSubmit = async (formData: LocalRankFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/local-rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to run scan");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 text-pink-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Local Rank Tracker
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            See Where You Rank in Google Maps
          </h1>
          <p className="text-xl text-slate-400">
            Check your local search visibility across your entire service area.
            Find gaps in your coverage and discover where competitors are winning.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {!result ? (
            /* Form State */
            <div className="max-w-xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
                <LocalRankForm onSubmit={handleSubmit} isLoading={isLoading} />

                {error && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">Error</p>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="mt-12 grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-pink-400 font-bold">1</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Enter Details</h3>
                  <p className="text-slate-400 text-sm">
                    Tell us your business name, keyword, and location
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-pink-400 font-bold">2</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">Grid Scan</h3>
                  <p className="text-slate-400 text-sm">
                    We check rankings at multiple points across your area
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-pink-400 font-bold">3</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">See Your Map</h3>
                  <p className="text-slate-400 text-sm">
                    Visual heat map shows where you rank and where you don&apos;t
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Results State */
            <div>
              {/* Back button */}
              <button
                onClick={() => setResult(null)}
                className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                ← New Scan
              </button>

              {/* Results Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">
                  Local Rank Results for &quot;{result.keyword}&quot;
                </h2>
                <p className="text-slate-400 mt-1">
                  Tracking: {result.business}
                </p>
              </div>

              {/* Results Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LocalRankGrid data={result} />
                </div>
                <div className="space-y-6">
                  <LocalRankStats data={result} />
                  <LocalRankDetails data={result} />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-8 border border-pink-500/20 text-center">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Want to Improve Your Local Rankings?
                </h3>
                <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                  Our local SEO experts can help you dominate your service area.
                  Get a free consultation to discuss your results.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Get Free Consultation
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
