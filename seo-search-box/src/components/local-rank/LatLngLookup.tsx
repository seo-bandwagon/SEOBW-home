"use client";

import { useState } from "react";
import { Loader2, Copy, Check, MapPin, ArrowRightLeft } from "lucide-react";

interface LookupResult {
  type: "address" | "coordinates";
  input: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
}

export function LatLngLookup() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isCoordinates = (text: string): boolean => {
    // Check if input looks like coordinates (two numbers separated by comma)
    const cleaned = text.trim();
    const match = cleaned.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (!match) return false;

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          type: isCoordinates(input) ? "reverse" : "forward",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Lookup failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const inputType = isCoordinates(input) ? "coordinates" : "address";

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="input"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Enter Address or Coordinates
          </label>
          <div className="relative">
            <input
              id="input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., 1600 Pennsylvania Ave, Washington DC  OR  38.8977, -77.0365"
              disabled={isLoading}
              className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 pr-24"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
              {inputType === "coordinates" ? (
                <span className="flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" />
                  → Address
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  → Coords
                </span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Enter an address to find its coordinates, or enter lat/lng
            (comma-separated) to find the address
          </p>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Looking up...
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              Look Up
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">Results</h3>

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
            {/* Coordinates */}
            <div>
              <div className="text-sm text-slate-400 mb-1">Coordinates</div>
              <div className="flex items-center justify-between">
                <code className="text-lg text-white font-mono">
                  {result.lat.toFixed(7)}, {result.lng.toFixed(7)}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${result.lat.toFixed(7)}, ${result.lng.toFixed(7)}`,
                      "coords"
                    )
                  }
                  className="p-2 hover:bg-slate-600 rounded transition-colors"
                  title="Copy coordinates"
                >
                  {copiedField === "coords" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="text-sm text-slate-400 mb-1">Address</div>
              <div className="flex items-center justify-between">
                <span className="text-white">{result.formattedAddress}</span>
                <button
                  onClick={() =>
                    copyToClipboard(result.formattedAddress, "address")
                  }
                  className="p-2 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  {copiedField === "address" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Place ID */}
            {result.placeId && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Place ID</div>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-white font-mono break-all">
                    {result.placeId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.placeId!, "placeId")}
                    className="p-2 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                    title="Copy Place ID"
                  >
                    {copiedField === "placeId" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Google Maps Link */}
            <div className="pt-2 border-t border-slate-600">
              <a
                href={`https://www.google.com/maps?q=${result.lat},${result.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                Open in Google Maps →
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <a
              href={`/tools/local-rank?lat=${result.lat}&lng=${result.lng}`}
              className="text-sm bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-full hover:bg-pink-500/20 transition-colors"
            >
              Check Local Rankings →
            </a>
            {result.placeId && (
              <a
                href={`/tools/place-id?id=${result.placeId}`}
                className="text-sm bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full hover:bg-green-500/20 transition-colors"
              >
                View Place Details →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
