import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSavedLocation, saveLocation, deleteSavedLocation } from "@/lib/db/queries";
import { isDatabaseConfigured } from "@/lib/db/client";

/**
 * GET — get the user's saved location
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ location: null });
  }

  try {
    const location = await getSavedLocation(session.user.id);
    return NextResponse.json({ location });
  } catch (error) {
    console.error("Failed to get saved location:", error);
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 });
  }
}

/**
 * POST — save or update the user's location (one per account)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { businessName, placeId, address, lat, lng } = body as {
      businessName: string;
      placeId?: string;
      address?: string;
      lat: number;
      lng: number;
    };

    if (!businessName || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "businessName, lat, and lng are required" },
        { status: 400 }
      );
    }

    const location = await saveLocation(session.user.id, {
      businessName,
      placeId,
      address,
      lat,
      lng,
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Failed to save location:", error);
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
  }
}

/**
 * DELETE — remove the user's saved location
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await deleteSavedLocation(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete location:", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
