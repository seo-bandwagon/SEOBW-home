"use client";

import {
  Phone,
  Building2,
  MapPin,
  Globe,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { SaveSearchButton } from "./SaveSearchButton";

interface PhoneResultsProps {
  data: {
    business: BusinessData | null;
    alternateResults: AlternateResult[];
  };
  query: string;
  searchId?: string | null;
}

interface BusinessData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
}

interface AlternateResult {
  name: string;
  address: string;
  phone: string;
  category: string;
}

export function PhoneResults({ data, query, searchId }: PhoneResultsProps) {
  const { business, alternateResults } = data;

  if (!business && alternateResults.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-8 text-center">
        <Phone className="mx-auto h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Results Found</h3>
        <p className="text-slate-400">
          {"We couldn't find business information for phone number \""}{query}{"\""}
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Try searching for the business name instead
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
      {/* Phone Number Display */}
      <div className="rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
            <Phone className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Phone Number</p>
            <p className="text-2xl font-bold text-white">{query}</p>
          </div>
        </div>
      </div>

      {/* Main Business Result */}
      {business && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20 flex-shrink-0">
              <Building2 className="h-7 w-7 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{business.name}</h2>
              {business.category && (
                <span className="inline-block px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-sm mb-3">
                  {business.category}
                </span>
              )}

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-500 mt-1 flex-shrink-0" />
                    <span>
                      {business.address}
                      {business.city && `, ${business.city}`}
                      {business.state && `, ${business.state}`}
                      {business.zip && ` ${business.zip}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{business.phone}</span>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {business.rating && (
                  <div className="flex items-center gap-4">
                    <div className="text-center p-4 rounded-lg bg-slate-700/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-2xl font-bold text-white">
                          {business.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {formatNumber(business.reviewCount)} reviews
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {business && (
        <div className="flex flex-wrap gap-3">
          <a
            href={`tel:${business.phone}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </a>
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Visit Website
            </a>
          )}
          {business.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                `${business.address}, ${business.city}, ${business.state}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Get Directions
            </a>
          )}
        </div>
      )}

      {/* Alternative Results */}
      {alternateResults.length > 0 && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Other Possible Matches
          </h3>
          <div className="space-y-3">
            {alternateResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-white">{result.name}</p>
                  <p className="text-sm text-slate-400">{result.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300">{result.phone}</p>
                  {result.category && (
                    <p className="text-xs text-slate-500">{result.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-4">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Note:</strong> Phone lookup results
          are based on publicly available business directory data. Some information
          may be incomplete or outdated.
        </p>
      </div>
    </div>
  );
}
