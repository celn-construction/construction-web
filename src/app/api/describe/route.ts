import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeDocument } from "@/server/services/tagging";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI description is not configured" },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const analysis = await analyzeDocument(buffer, file.type, file.name);

    // Only return AI-generated descriptions, not generic fallbacks
    if (!analysis.description || analysis.description.startsWith("File:") || analysis.description.startsWith("PDF document:")) {
      return NextResponse.json(
        { error: "Could not generate a meaningful description for this file type" },
        { status: 422 }
      );
    }

    return NextResponse.json({ description: analysis.description });
  } catch (error) {
    console.error("Describe error:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
