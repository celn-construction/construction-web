// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock embeddings service before importing the router
vi.mock("@/server/services/embeddings", () => ({
  embedQuery: vi.fn(),
  toVectorSql: vi.fn(),
}));

// Mock Vercel Blob (imported by document router for delete)
vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
}));

// Mock the tRPC module to expose orgProcedure as a passthrough
vi.mock("@/server/api/trpc", () => {
  const mockProcedure = {
    input: (schema: unknown) => {
      const chain = {
        _schema: schema,
        query: (handler: unknown) => ({ ...chain, _handler: handler }),
        mutation: (handler: unknown) => ({ ...chain, _handler: handler }),
      };
      return chain;
    },
  };
  return {
    createTRPCRouter: (routes: Record<string, unknown>) => routes,
    orgProcedure: mockProcedure,
  };
});

import { embedQuery, toVectorSql } from "@/server/services/embeddings";

const mockEmbedQuery = embedQuery as ReturnType<typeof vi.fn>;
const mockToVectorSql = toVectorSql as ReturnType<typeof vi.fn>;

// Helper: build a fake RawDocumentRow
function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "doc-1",
    name: "Foundation Report.pdf",
    blobUrl: "https://blob.example.com/doc-1",
    mimeType: "application/pdf",
    size: 1024,
    tags: ["foundation", "concrete"],
    description: "Structural assessment",
    taskId: "task-1",
    folderId: "inspections-structural",
    projectId: "proj-1",
    uploadedById: "user-1",
    createdAt: new Date("2026-03-15"),
    rank: 0.0325,
    total_count: BigInt(3),
    uploader_id: "user-1",
    uploader_name: "John Smith",
    uploader_email: "john@example.com",
    ...overrides,
  };
}

// Helper: build a mock ctx
function makeCtx(dbOverrides: Record<string, unknown> = {}) {
  return {
    db: {
      project: {
        findFirst: vi.fn(),
      },
      $queryRaw: vi.fn(),
      ...dbOverrides,
    },
    organization: { id: "org-1" },
    session: { user: { id: "user-1" } },
  };
}

describe("aiSearch procedure", () => {
  let aiSearch: { _handler: (args: { ctx: ReturnType<typeof makeCtx>; input: Record<string, unknown> }) => Promise<unknown> };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockEmbedQuery.mockResolvedValue([0.1, 0.2, 0.3]);
    mockToVectorSql.mockReturnValue("[0.1,0.2,0.3]");

    // Dynamic import to pick up mocks
    const mod = await import("@/server/api/routers/document");
    const router = mod.documentRouter as unknown as Record<string, typeof aiSearch>;
    aiSearch = router.aiSearch;
  });

  it("returns empty results when project is not found", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue(null);

    const result = await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "foundation", limit: 20, offset: 0, linkFilter: "all" },
    });

    expect(result).toEqual({ results: [], total: 0 });
    expect(mockEmbedQuery).not.toHaveBeenCalled();
  });

  it("calls embedQuery with the user query", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([]);

    await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "foundation photos", limit: 20, offset: 0, linkFilter: "all" },
    });

    expect(mockEmbedQuery).toHaveBeenCalledWith("foundation photos");
  });

  it("expands acronyms for the keyword query", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([]);

    await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "MEP RFI", limit: 20, offset: 0, linkFilter: "all" },
    });

    // The $queryRaw template string includes the expanded acronyms
    expect(ctx.db.$queryRaw).toHaveBeenCalled();
    const callArgs = ctx.db.$queryRaw.mock.calls[0];
    // Template literal call — the values array contains the expanded keyword query
    const values = Array.isArray(callArgs[0]) ? callArgs.slice(1) : [];
    // The expanded query should be passed as a parameter
    const allArgs = JSON.stringify(callArgs);
    expect(allArgs).toContain("MEP mechanical electrical plumbing RFI request for information");
  });

  it("passes null when folderIds is not provided", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([]);

    await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "test", limit: 20, offset: 0, linkFilter: "all" },
    });

    const callArgs = ctx.db.$queryRaw.mock.calls[0];
    const allArgs = JSON.stringify(callArgs);
    expect(allArgs).toContain("null");
  });

  it("passes folderIds array when provided", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([]);

    await aiSearch._handler({
      ctx,
      input: {
        projectId: "proj-1",
        query: "test",
        limit: 20,
        offset: 0,
        folderIds: ["rfi", "photos"],
        linkFilter: "all",
      },
    });

    const callArgs = ctx.db.$queryRaw.mock.calls[0];
    const allArgs = JSON.stringify(callArgs);
    expect(allArgs).toContain("rfi");
    expect(allArgs).toContain("photos");
  });

  it("shapes results with uploader info", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([makeRow()]);

    const result = await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "foundation", limit: 20, offset: 0, linkFilter: "all" },
    }) as { results: Array<{ uploadedBy: { id: string; name: string | null; email: string } }>; total: number };

    expect(result.results).toHaveLength(1);
    expect(result.results[0]!.uploadedBy).toEqual({
      id: "user-1",
      name: "John Smith",
      email: "john@example.com",
    });
  });

  it("computes total from total_count field", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([
      makeRow({ total_count: BigInt(42) }),
      makeRow({ id: "doc-2", total_count: BigInt(42) }),
    ]);

    const result = await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "test", limit: 20, offset: 0, linkFilter: "all" },
    }) as { total: number };

    expect(result.total).toBe(42);
  });

  it("returns total 0 when no rows returned", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([]);

    const result = await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "nonexistent", limit: 20, offset: 0, linkFilter: "all" },
    }) as { total: number };

    expect(result.total).toBe(0);
  });

  it("strips uploader raw fields from shaped results", async () => {
    const ctx = makeCtx();
    ctx.db.project.findFirst.mockResolvedValue({ id: "proj-1" });
    ctx.db.$queryRaw.mockResolvedValue([makeRow()]);

    const result = await aiSearch._handler({
      ctx,
      input: { projectId: "proj-1", query: "test", limit: 20, offset: 0, linkFilter: "all" },
    }) as { results: Array<Record<string, unknown>> };

    const doc = result.results[0]!;
    expect(doc).not.toHaveProperty("uploader_id");
    expect(doc).not.toHaveProperty("uploader_name");
    expect(doc).not.toHaveProperty("uploader_email");
    expect(doc).not.toHaveProperty("total_count");
  });
});
