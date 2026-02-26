import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { extensionAnalyses } from "@/lib/db/schema";

// CORS headers for extension requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-SEO-Analyzer",
};

// ============================================
// In-memory rate limiter
// ============================================
// Keyed by sessionId (anonymous) or IP fallback
// Limits: 1 request per 10 seconds, 100 per hour
const rateLimitMap = new Map<string, { timestamps: number[] }>();
const RATE_WINDOW_MS = 10_000; // 10 seconds between requests
const HOURLY_LIMIT = 100;
const HOURLY_WINDOW_MS = 3_600_000;

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t) => now - t < HOURLY_WINDOW_MS);
    if (entry.timestamps.length === 0) rateLimitMap.delete(key);
  });
}, 600_000);

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(key, entry);
  }

  // Clean old timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < HOURLY_WINDOW_MS);

  // Check hourly limit
  if (entry.timestamps.length >= HOURLY_LIMIT) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + HOURLY_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Check per-request cooldown (last request must be >= RATE_WINDOW_MS ago)
  const lastRequest = entry.timestamps[entry.timestamps.length - 1];
  if (lastRequest && now - lastRequest < RATE_WINDOW_MS) {
    const retryAfter = Math.ceil((lastRequest + RATE_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Allowed — record this request
  entry.timestamps.push(now);
  return { allowed: true };
}

// ============================================
// Routes
// ============================================

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Rate limit key: prefer sessionId, fall back to IP
    const rateLimitKey =
      (typeof body.sessionId === "string" && body.sessionId) ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.ip ||
      "unknown";

    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateCheck.retryAfter },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(rateCheck.retryAfter ?? 10),
          },
        }
      );
    }

    // Validate required fields
    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic payload size sanity check (reject > 500KB)
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 512_000) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413, headers: corsHeaders }
      );
    }

    // Extract domain from URL
    let domain: string;
    try {
      domain = new URL(body.url).hostname;
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate overall score from section scores
    const sectionScores = [
      body.meta?.score,
      body.headings?.score,
      body.images?.score,
      body.links?.score,
      body.schema?.score,
      body.content?.score,
      body.readability?.score,
    ].filter((s): s is number => typeof s === "number");

    const overallScore =
      sectionScores.length > 0
        ? Math.round(
            sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
          )
        : null;

    const scores = {
      meta: body.meta?.score ?? null,
      headings: body.headings?.score ?? null,
      images: body.images?.score ?? null,
      links: body.links?.score ?? null,
      schema: body.schema?.score ?? null,
      content: body.content?.score ?? null,
      readability: body.readability?.score ?? null,
    };

    // Insert into database
    const [result] = await db
      .insert(extensionAnalyses)
      .values({
        url: body.url,
        domain,
        overallScore,
        scores,
        meta: body.meta ?? null,
        headings: body.headings ?? null,
        images: body.images ?? null,
        links: body.links ?? null,
        schemaData: body.schema ?? null,
        content: body.content ?? null,
        readability: body.readability ?? null,
        ngrams: body.ngrams ?? null,
        extensionVersion: body.extensionVersion ?? null,
        userAgent: body.userAgent ?? null,
        sessionId: body.sessionId ?? null,
      })
      .returning({ id: extensionAnalyses.id });

    return NextResponse.json(
      { success: true, id: result.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Extension analysis save failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
