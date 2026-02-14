import { Navbar } from "@/components/common/Navbar";
import { PlaceIdLookup } from "@/components/local-rank/PlaceIdLookup";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Place ID Finder | Free Place ID Lookup - SEO Bandwagon",
  description:
    "Find the Google Place ID for any business. Essential for Google Business Profile optimization, API integrations, and local SEO tracking.",
  keywords:
    "google place id, place id finder, place id lookup, google business profile, google maps api, local seo",
};

export default function PlaceIdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Free Tool
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Google Place ID Finder
          </h1>
          <p className="text-xl text-slate-400">
            Find the unique Place ID for any business on Google Maps. Required
            for API integrations and accurate business tracking.
          </p>
        </div>

        {/* Tool */}
        <div className="max-w-2xl mx-auto">
          <PlaceIdLookup />
        </div>

        {/* SEO Content */}
        <div className="max-w-4xl mx-auto mt-16 prose prose-invert prose-slate">
          <h2>What is a Google Place ID?</h2>
          <p>
            A Google Place ID is a unique identifier that Google assigns to
            every place in its database. It&apos;s a stable, unchanging reference
            that allows you to precisely identify a specific business, landmark,
            or location across Google&apos;s services.
          </p>

          <h2>Why Do You Need a Place ID?</h2>
          <ul>
            <li>
              <strong>Local Rank Tracking:</strong> Track a specific business&apos;s
              rankings without name-matching ambiguity
            </li>
            <li>
              <strong>Google Maps API:</strong> Reference a place directly in
              API calls for reviews, details, or directions
            </li>
            <li>
              <strong>Google Business Profile:</strong> Verify you&apos;re working
              with the correct listing
            </li>
            <li>
              <strong>Competitor Analysis:</strong> Monitor specific competitor
              locations accurately
            </li>
            <li>
              <strong>Multi-Location Businesses:</strong> Distinguish between
              different branches of the same business
            </li>
          </ul>

          <h2>How Place IDs Work</h2>
          <p>
            Place IDs are permanent identifiers that don&apos;t change even if a
            business updates its name, address, or phone number. They look like:
          </p>
          <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto">
            <code>ChIJN1t_tDeuEmsRUsoyG83frY4</code>
          </pre>
          <p>
            This alphanumeric string can be used in Google Maps URLs, API calls,
            and SEO tools to reference the exact same place every time.
          </p>

          <h2>Related Tools</h2>
          <ul>
            <li>
              <a href="/tools/local-rank">Local Rank Tracker</a> — Track
              rankings using Place ID for accuracy
            </li>
            <li>
              <a href="/tools/lat-lng">Lat/Long Lookup</a> — Find coordinates
              for any address
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
