"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Building2, Star, MapPin, Phone, Globe } from "lucide-react";

interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  types?: string[];
  businessStatus?: string;
}

export function PlaceIdLookup() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PlaceDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !location.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/place-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${businessName} ${location}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Search failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (placeId: string) => {
    await navigator.clipboard.writeText(placeId);
    setCopiedId(placeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            <Building2 className="inline-block w-4 h-4 mr-1" />
            Business Name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., Starbucks, Joe's Pizza, Seattle Dental"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            <MapPin className="inline-block w-4 h-4 mr-1" />
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Seattle, WA or 123 Main St, Seattle"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!businessName.trim() || !location.trim() || isLoading}
          className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5" />
              Find Place ID
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </h3>

          <div className="space-y-4">
            {results.map((place) => (
              <div
                key={place.placeId}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-white font-medium text-lg">
                      {place.name}
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">
                      {place.formattedAddress}
                    </p>
                  </div>
                  {place.rating && (
                    <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-sm flex-shrink-0">
                      <Star className="w-4 h-4 fill-current" />
                      {place.rating} ({place.reviewCount})
                    </div>
                  )}
                </div>

                {/* Place ID */}
                <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Place ID</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-green-400 font-mono text-sm break-all">
                      {place.placeId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(place.placeId)}
                      className="p-2 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                      title="Copy Place ID"
                    >
                      {copiedId === place.placeId ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {place.phone && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {place.phone}
                    </div>
                  )}
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-slate-600 flex gap-2 flex-wrap">
                  <a
                    href={`/tools/local-rank?lat=${encodeURIComponent(String(place.lat))}&lng=${encodeURIComponent(String(place.lng))}&placeId=${encodeURIComponent(place.placeId)}`}
                    className="text-sm bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-full hover:bg-pink-500/20 transition-colors"
                  >
                    Check Local Rankings →
                  </a>
                  <a
                    href={`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(place.placeId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-colors"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !isLoading && !error && businessName && (
        <div className="mt-6 text-center text-slate-400">
          No results yet. Enter a business name and location to search.
        </div>
      )}
    </div>
  );
}
