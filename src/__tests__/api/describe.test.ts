// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock tagging service
vi.mock("@/server/services/tagging", () => ({
  analyzeDocument: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { analyzeDocument } from "@/server/services/tagging";

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockAnalyzeDocument = analyzeDocument as ReturnType<typeof vi.fn>;

function makeRequest(file?: File) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return new Request("http://localhost:5050/api/describe", {
    method: "POST",
    body: formData,
  });
}

function makeFile(name = "photo.jpg", type = "image/jpeg") {
  return new File(["fake-image-data"], name, { type });
}

describe("/api/describe", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    // Default: ANTHROPIC_API_KEY is set
    process.env.ANTHROPIC_API_KEY = "sk-test-key";

    const mod = await import("@/app/api/describe/route");
    POST = mod.POST as unknown as typeof POST;
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest(makeFile()));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 503 when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const res = await POST(makeRequest(makeFile()));
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.error).toBe("AI description is not configured");
  });

  it("returns 400 when no file is provided", async () => {
    const req = new Request("http://localhost:5050/api/describe", {
      method: "POST",
      body: new FormData(),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("No file provided");
  });

  it("returns AI-generated description on success", async () => {
    mockAnalyzeDocument.mockResolvedValue({
      tags: ["drywall", "interior"],
      description: "Interior wall with freshly installed drywall panels showing joint compound along seams.",
    });

    const res = await POST(makeRequest(makeFile()));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.description).toBe(
      "Interior wall with freshly installed drywall panels showing joint compound along seams."
    );
  });

  it("calls analyzeDocument with a data URL", async () => {
    mockAnalyzeDocument.mockResolvedValue({
      tags: [],
      description: "A construction photo.",
    });

    await POST(makeRequest(makeFile("site.png", "image/png")));

    expect(mockAnalyzeDocument).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/png;base64,/),
      "image/png",
      "site.png"
    );
  });

  it("returns 422 when description is a generic fallback", async () => {
    mockAnalyzeDocument.mockResolvedValue({
      tags: [],
      description: "File: Dog Puppy Garden Image",
    });

    const res = await POST(makeRequest(makeFile("image.avif", "image/avif")));
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error).toContain("Could not generate a meaningful description");
  });

  it("returns 422 for PDF fallback descriptions", async () => {
    mockAnalyzeDocument.mockResolvedValue({
      tags: [],
      description: "PDF document: report",
    });

    const res = await POST(makeRequest(makeFile("report.pdf", "application/pdf")));
    expect(res.status).toBe(422);
  });

  it("returns 500 when analyzeDocument throws", async () => {
    mockAnalyzeDocument.mockRejectedValue(new Error("API timeout"));

    const res = await POST(makeRequest(makeFile()));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("Failed to generate description");
  });
});
