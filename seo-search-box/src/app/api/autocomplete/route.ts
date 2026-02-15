import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");
  const types = searchParams.get("types") || "establishment";
  const sessionToken = searchParams.get("session");

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Autocomplete not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", input);
    url.searchParams.set("types", types);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    
    // Session tokens reduce costs by grouping autocomplete + place details
    if (sessionToken) {
      url.searchParams.set("sessiontoken", sessionToken);
    }

    // Bias towards US results
    url.searchParams.set("components", "country:us");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places Autocomplete error:", data.status, data.error_message);
      return NextResponse.json({ predictions: [] });
    }

    // Transform to simpler format
    const predictions = (data.predictions || []).map(
      (p: {
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text: string;
          secondary_text?: string;
        };
        types?: string[];
      }) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || "",
        types: p.types || [],
      })
    );

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json({ predictions: [] });
  }
}
