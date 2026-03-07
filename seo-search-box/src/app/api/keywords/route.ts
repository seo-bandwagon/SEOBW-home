import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://rraubczrlpaushskzpfc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

// GET /api/keywords - List all tracked keywords
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  
  try {
    let url = `${SUPABASE_URL}/rest/v1/tracked_keywords?select=*&order=domain.asc,keyword.asc`;
    
    if (domain) {
      url += `&domain=eq.${encodeURIComponent(domain)}`;
    }
    
    const res = await fetch(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch keywords");
    }
    
    const keywords = await res.json();
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}
