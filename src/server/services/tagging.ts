import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

export interface DocumentAnalysis {
  tags: string[];
  description: string;
}

export async function analyzeDocument(
  blobUrl: string,
  mimeType: string,
  name: string
): Promise<DocumentAnalysis> {
  try {
    if (IMAGE_MIME_TYPES.includes(mimeType)) {
      return await analyzeImage(blobUrl, mimeType);
    }
    return {
      tags: tagByType(mimeType, name),
      description: describeByType(mimeType, name),
    };
  } catch {
    return { tags: [], description: describeByType(mimeType, name) };
  }
}

async function analyzeImage(
  blobUrl: string,
  mimeType: string
): Promise<DocumentAnalysis> {
  const response = await fetch(blobUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: `Analyze this construction site image. Return a JSON object with two fields:
1. "tags": an array of 5-10 lowercase tags describing materials, equipment, work phase, site conditions, or document type.
2. "description": a 1-3 sentence natural language description of what is visible. Include colors, materials, finishes, locations, and construction activities. Be specific and descriptive. Include common synonyms for materials when relevant.

Return ONLY valid JSON, no markdown fences.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text : "{}";

  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { tags?: string[]; description?: string };
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      description: typeof parsed.description === "string" ? parsed.description : describeByType("image/*", "image"),
    };
  } catch {
    return { tags: [], description: describeByType("image/*", "image") };
  }
}

function tagByType(mimeType: string, name: string): string[] {
  const base: string[] = [];
  if (mimeType === "application/pdf") {
    base.push("pdf", "document");
  } else if (mimeType.includes("sheet") || mimeType === "text/csv") {
    base.push("spreadsheet", "data");
  } else if (mimeType.includes("word")) {
    base.push("document", "word");
  } else if (
    mimeType.includes("dxf") ||
    mimeType.includes("dwg") ||
    mimeType.includes("acad")
  ) {
    base.push("drawing", "cad");
  }

  const stem = name.replace(/\.[^.]+$/, "");
  const words = stem
    .split(/[\s_\-]+/)
    .filter((w) => w.length >= 4)
    .map((w) => w.toLowerCase());

  return [...new Set([...base, ...words])];
}

function describeByType(mimeType: string, name: string): string {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[\s_\-]+/g, " ");

  if (mimeType === "application/pdf") return `PDF document: ${stem}`;
  if (mimeType.includes("sheet") || mimeType === "text/csv") return `Spreadsheet: ${stem}`;
  if (mimeType.includes("word")) return `Word document: ${stem}`;
  if (mimeType.includes("dxf") || mimeType.includes("dwg") || mimeType.includes("acad")) return `CAD drawing: ${stem}`;
  return `File: ${stem}`;
}
