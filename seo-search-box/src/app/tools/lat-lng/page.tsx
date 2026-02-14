import { Navbar } from "@/components/common/Navbar";
import { LatLngLookup } from "@/components/local-rank/LatLngLookup";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latitude Longitude Lookup | Free Lat/Long Finder - SEO Bandwagon",
  description:
    "Free latitude and longitude lookup tool. Find GPS coordinates for any address, or convert lat/long to a street address. Essential for local SEO and Google Maps optimization.",
  keywords:
    "latitude longitude lookup, lat long finder, gps coordinates, address to coordinates, coordinates to address, geocoding tool",
};

export default function LatLngPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Free Tool
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Latitude &amp; Longitude Lookup
          </h1>
          <p className="text-xl text-slate-400">
            Find GPS coordinates for any address, or convert latitude/longitude
            to a street address. Perfect for local SEO and Google Maps work.
          </p>
        </div>

        {/* Tool */}
        <div className="max-w-2xl mx-auto">
          <LatLngLookup />
        </div>

        {/* SEO Content */}
        <div className="max-w-4xl mx-auto mt-16 prose prose-invert prose-slate">
          <h2>What is Latitude and Longitude?</h2>
          <p>
            Latitude and longitude are geographic coordinates that specify the
            precise location of a point on Earth. Latitude measures north-south
            position (ranging from -90° at the South Pole to +90° at the North
            Pole), while longitude measures east-west position (ranging from
            -180° to +180° from the Prime Meridian).
          </p>

          <h2>Why Use a Lat/Long Lookup Tool?</h2>
          <ul>
            <li>
              <strong>Local SEO:</strong> Accurate coordinates help with Google
              Business Profile optimization and local search rankings
            </li>
            <li>
              <strong>Google Maps API:</strong> Many mapping applications
              require precise coordinates for markers and routing
            </li>
            <li>
              <strong>Data Analysis:</strong> Convert addresses to coordinates
              for geospatial analysis and visualization
            </li>
            <li>
              <strong>Citation Building:</strong> Ensure consistent NAP+
              coordinates across business directories
            </li>
          </ul>

          <h2>How to Use This Tool</h2>
          <ol>
            <li>
              <strong>Address to Coordinates:</strong> Enter a street address,
              city, or place name to get the latitude and longitude
            </li>
            <li>
              <strong>Coordinates to Address:</strong> Enter latitude and
              longitude (comma-separated) to find the nearest address
            </li>
          </ol>

          <h2>Common Coordinate Formats</h2>
          <p>
            Coordinates can be written in several formats. This tool accepts:
          </p>
          <ul>
            <li>
              <strong>Decimal Degrees (DD):</strong> 47.6062, -122.3321
            </li>
            <li>
              <strong>Degrees Minutes Seconds (DMS):</strong> 47°36&apos;22.3&quot;N,
              122°19&apos;55.6&quot;W
            </li>
          </ul>

          <h2>Related Tools</h2>
          <ul>
            <li>
              <a href="/tools/local-rank">Local Rank Tracker</a> — See where you
              rank in Google Maps across your service area
            </li>
            <li>
              <a href="/tools/place-id">Place ID Finder</a> — Find the Google
              Place ID for any business
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
