import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

// GET /api/clients
export async function GET() {
  try {
    const clients = await db.execute(sql`SELECT * FROM clients ORDER BY name ASC`);
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contact_email, gsc_site_url, ga4_property_id, notes, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db.execute(sql`
      INSERT INTO clients (name, contact_email, gsc_site_url, ga4_property_id, notes, status)
      VALUES (${name}, ${contact_email || null}, ${gsc_site_url || null}, ${ga4_property_id || null}, ${notes || null}, ${status || 'active'})
      RETURNING *
    `);

    return NextResponse.json({ client: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
