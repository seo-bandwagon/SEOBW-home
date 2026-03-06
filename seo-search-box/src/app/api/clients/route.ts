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
  
  return res.json();
}

// GET /api/clients - List all clients
export async function GET() {
  try {
    const clients = await supabaseRequest("clients?select=*&order=name.asc");
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contact_email, gsc_site_url, ga4_property_id, notes } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const client = await supabaseRequest("clients", {
      method: "POST",
      body: JSON.stringify({
        name,
        contact_email,
        gsc_site_url,
        ga4_property_id,
        notes,
      }),
    });
    
    return NextResponse.json({ client: client[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
