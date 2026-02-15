import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const GeocodeRequestSchema = z.object({
  input: z.string().min(1),
  type: z.enum(["forward", "reverse"]).default("forward"),
});

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
  type: "address" | "coordinates";
  input: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Geocoding not configured", message: "Google Maps API key missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { input, type } = GeocodeRequestSchema.parse(body);

    let url: string;

    if (type === "reverse") {
      // Parse coordinates
      const match = input.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid coordinates", message: "Expected format: lat, lng" },
          { status: 400 }
        );
      }

      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      // Validate coordinate ranges and finiteness before calling Google
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return NextResponse.json(
          {
            error: "Invalid coordinates",
            message:
              "Latitude must be between -90 and 90 and longitude between -180 and 180",
          },
          { status: 400 }
        );
      }
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    } else {
      // Forward geocode (address to coordinates)
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // ignore body read errors
      }

      console.error("Geocode upstream HTTP error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });

      return NextResponse.json(
        {
          error: "Geocoding service error",
          message: "Upstream geocoding request failed",
        },
        { status: 502 }
      );
    }
    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        { error: "Not found", message: "No results found for this location" },
        { status: 404 }
      );
    }

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: "Geocoding failed", message: data.status },
        { status: 500 }
      );
    }

    const result = data.results[0];

    const geocodeResult: GeocodeResult = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      type: type === "reverse" ? "coordinates" : "address",
      input,
    };

    return NextResponse.json(geocodeResult);
  } catch (error) {
    console.error("Geocode API error:", error);

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
