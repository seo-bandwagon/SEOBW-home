import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_BASE = process.env.MCP_SERVER_URL || "https://api.seobandwagon.dev";

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/auth/status?email=${encodeURIComponent(session.user.email)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
