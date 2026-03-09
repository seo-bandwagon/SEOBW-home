import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

// GET /api/clients/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await db.execute(sql`SELECT * FROM clients WHERE id = ${id} LIMIT 1`);
    if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ client: result[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

// PATCH /api/clients/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, contact_email, gsc_site_url, ga4_property_id, notes, status } = body;

    const result = await db.execute(sql`
      UPDATE clients SET
        name = COALESCE(${name}, name),
        contact_email = COALESCE(${contact_email}, contact_email),
        gsc_site_url = COALESCE(${gsc_site_url}, gsc_site_url),
        ga4_property_id = COALESCE(${ga4_property_id}, ga4_property_id),
        notes = COALESCE(${notes}, notes),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);

    if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ client: result[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

// DELETE /api/clients/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.execute(sql`DELETE FROM clients WHERE id = ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
