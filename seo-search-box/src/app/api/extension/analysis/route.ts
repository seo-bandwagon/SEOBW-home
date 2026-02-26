import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { extensionAnalyses } from "@/lib/db/schema";

// CORS headers for extension requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400, headers: corsHeaders }
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
