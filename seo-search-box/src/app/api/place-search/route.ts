import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const PlaceSearchRequestSchema = z.object({
  query: z.string().min(1),
});

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

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Place search not configured", message: "Google Maps API key missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query } = PlaceSearchRequestSchema.parse(body);

    // First, search for places using Text Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status === "ZERO_RESULTS") {
      return NextResponse.json({ results: [] });
    }

    if (searchData.status !== "OK") {
      return NextResponse.json(
        { error: "Search failed", message: searchData.status },
        { status: 500 }
      );
    }

    // Get details for each result (limit to top 5)
    const places = searchData.results.slice(0, 5);
    const results: PlaceDetails[] = [];

    for (const place of places) {
      // Get detailed info for each place
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,website,types,business_status&key=${GOOGLE_MAPS_API_KEY}`;

      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === "OK" && detailsData.result) {
        const detail = detailsData.result;
        results.push({
          placeId: detail.place_id,
          name: detail.name,
          formattedAddress: detail.formatted_address,
          lat: detail.geometry.location.lat,
          lng: detail.geometry.location.lng,
          rating: detail.rating,
          reviewCount: detail.user_ratings_total,
          phone: detail.formatted_phone_number,
          website: detail.website,
          types: detail.types,
          businessStatus: detail.business_status,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Place search API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
