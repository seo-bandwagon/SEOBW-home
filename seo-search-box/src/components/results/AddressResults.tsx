"use client";

import { MapPin, Navigation, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SaveSearchButton } from "./SaveSearchButton";

interface AddressResultsProps {
  data: {
    geocode: GeocodeData | null;
    nearbyBusinesses: NearbyBusiness[];
  };
  query: string;
  searchId?: string | null;
}

interface GeocodeData {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId: string;
  components: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface NearbyBusiness {
  name: string;
  placeId: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  distance: string;
}

export function AddressResults({ data, query, searchId }: AddressResultsProps) {
  const { geocode, nearbyBusinesses } = data;

  if (!geocode) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-8 text-center">
        <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Location Not Found
        </h3>
        <p className="text-slate-400">
          We couldn&apos;t find coordinates for &quot;{query}&quot;. Try a more specific address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <SaveSearchButton searchId={searchId ?? null} query={query} />
      </div>

      {/* Location Card */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-pink-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white mb-1">
              {geocode.formattedAddress}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Navigation className="w-4 h-4" />
              <span className="font-mono">
                {geocode.lat.toFixed(6)}, {geocode.lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/tools/local-rank?lat=${geocode.lat}&lng=${geocode.lng}`}
            className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            Check Local Rankings Here
          </Link>
          <a
            href={`https://www.google.com/maps?q=${geocode.lat},${geocode.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </a>
        </div>

        {/* Coordinates Copy Section */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Latitude</div>
            <div className="text-white font-mono">{geocode.lat.toFixed(7)}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Longitude</div>
            <div className="text-white font-mono">{geocode.lng.toFixed(7)}</div>
          </div>
        </div>

        {geocode.placeId && (
          <div className="mt-4 bg-slate-700/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Place ID</div>
            <div className="text-white font-mono text-sm break-all">
              {geocode.placeId}
            </div>
          </div>
        )}
      </div>

      {/* Nearby Businesses */}
      {nearbyBusinesses && nearbyBusinesses.length > 0 && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400" />
            Nearby Businesses
          </h3>
          <div className="space-y-3">
            {nearbyBusinesses.map((business, i) => (
              <div
                key={business.placeId || i}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{business.name}</div>
                  <div className="text-slate-400 text-sm">
                    {business.category} • {business.distance}
                  </div>
                </div>
                {business.rating && (
                  <div className="text-yellow-400 text-sm">
                    ⭐ {business.rating} ({business.reviewCount})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Tools */}
      <div className="rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Local SEO Tools
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/tools/local-rank"
            className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="text-pink-400 font-medium mb-1">
              Local Rank Tracker
            </div>
            <div className="text-slate-400 text-sm">
              See where businesses rank across a service area
            </div>
          </Link>
          <Link
            href="/tools/place-id"
            className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="text-green-400 font-medium mb-1">
              Place ID Finder
            </div>
            <div className="text-slate-400 text-sm">
              Get Google Place IDs for tracking
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
