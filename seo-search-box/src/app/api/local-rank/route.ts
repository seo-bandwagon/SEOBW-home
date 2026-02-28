import { NextRequest, NextResponse } from "next/server";
import { runGridScan, findBusiness } from "@/lib/dataforseo";
import { z } from "zod";

// Request validation schema
const LocalRankRequestSchema = z.object({
  keyword: z.string().min(1),
  // Location can be provided in multiple ways:
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  placeId: z.string().optional(),
  businessName: z.string().optional(),
  location: z.string().optional(), // City/state for business lookup
  // Grid options
  gridSize: z.number().int().min(3).max(9).default(5),
  radiusMiles: z.number().min(1).max(25).default(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LocalRankRequestSchema.parse(body);

    let centerLat: number;
    let centerLng: number;
    let placeId: string | undefined = parsed.placeId;
    let businessName: string | undefined = parsed.businessName;

    // Determine center coordinates
    if (parsed.lat !== undefined && parsed.lng !== undefined) {
      // Direct lat/lng provided
      centerLat = parsed.lat;
      centerLng = parsed.lng;
    } else if (parsed.businessName && parsed.location) {
      // Look up business to get coordinates
      const business = await findBusiness(
        parsed.keyword,
        parsed.businessName,
        parsed.location
      );

      if (!business) {
        return NextResponse.json(
          {
            error: "Business not found",
            message: `Could not find "${parsed.businessName}" in "${parsed.location}" for keyword "${parsed.keyword}"`,
          },
          { status: 404 }
        );
      }

      centerLat = business.latitude;
      centerLng = business.longitude;
      placeId = business.place_id;
      businessName = business.title;
    } else {
      return NextResponse.json(
        {
          error: "Invalid request",
          message:
            "Must provide either lat/lng coordinates, or businessName + location for lookup",
        },
        { status: 400 }
      );
    }

    // Run the grid scan
    const result = await runGridScan(
      parsed.keyword,
      centerLat,
      centerLng,
      businessName,
      placeId,
      {
        gridSize: parsed.gridSize,
        radiusMiles: parsed.radiusMiles,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Local rank API error:", error);

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

// GET endpoint for simple queries via URL params
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const keyword = searchParams.get("keyword");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const businessName = searchParams.get("business");
  const location = searchParams.get("location");
  const placeId = searchParams.get("placeId");
  const gridSize = searchParams.get("grid");
  const radiusMiles = searchParams.get("radius");

  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  // Build POST body from query params
  const body: Record<string, unknown> = { keyword };

  if (lat && lng) {
    body.lat = parseFloat(lat);
    body.lng = parseFloat(lng);
  }
  if (businessName) body.businessName = businessName;
  if (location) body.location = location;
  if (placeId) body.placeId = placeId;
  if (gridSize) body.gridSize = parseInt(gridSize, 10);
  if (radiusMiles) body.radiusMiles = parseFloat(radiusMiles);

  // Reuse POST handler
  const fakeRequest = {
    json: async () => body,
  } as NextRequest;

  return POST(fakeRequest);
}
