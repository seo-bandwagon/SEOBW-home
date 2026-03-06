import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://rraubczrlpaushskzpfc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const clients = await supabaseRequest(`clients?id=eq.${id}&select=*`);
    
    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    
    return NextResponse.json({ client: clients[0] });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { name, contact_email, gsc_site_url, ga4_property_id, notes, status } = body;
    
    const client = await supabaseRequest(`clients?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        contact_email,
        gsc_site_url,
        ga4_property_id,
        notes,
        status,
        updated_at: new Date().toISOString(),
      }),
    });
    
    return NextResponse.json({ client: client[0] });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await supabaseRequest(`clients?id=eq.${id}`, {
      method: "DELETE",
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
