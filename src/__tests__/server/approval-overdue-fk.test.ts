// @vitest-environment node
//
// Phase 3 — Slot ↔ Document FK binding.
//
// Before Phase 3, overdue logic was positional: for each (task, kind), count
// docs in the folder family; slots at index >= that count were considered
// unfilled, and any past-due unfilled slot was overdue. After Phase 3, a
// slot is "filled" only if Document.slotId points at it — independent of
// upload order or how many docs landed in the folder.
//
// These tests pin that the Prisma query expresses the new "no bound
// document" semantics, not the old positional count.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/api/trpc", () => {
  const buildChain = () => {
    const chain: Record<string, unknown> = {
      input: (schema: unknown) => {
        chain._schema = schema;
        return chain;
      },
      query: (handler: unknown) => ({ _handler: handler, _schema: chain._schema }),
      mutation: (handler: unknown) => ({ _handler: handler, _schema: chain._schema }),
    };
    return chain;
  };
  return {
    createTRPCRouter: (routes: Record<string, unknown>) => routes,
    protectedProcedure: buildChain(),
    publicProcedure: buildChain(),
    projectProcedure: buildChain(),
    orgProcedure: buildChain(),
  };
});

type Handler = (args: { ctx: ReturnType<typeof makeCtx>; input: unknown }) => Promise<unknown>;

const ORG_ID = "org-1";
const PROJECT_ID = "proj-1";

function makeCtx() {
  const projectFindFirst = vi.fn().mockResolvedValue({ id: PROJECT_ID });
  const slotFindMany = vi.fn().mockResolvedValue([]);
  const slotCount = vi.fn().mockResolvedValue(0);
  const documentGroupBy = vi.fn().mockResolvedValue([]);
  return {
    db: {
      project: { findFirst: projectFindFirst },
      taskRequirementSlot: { findMany: slotFindMany, count: slotCount },
      document: { groupBy: documentGroupBy },
    },
    session: { user: { id: "user-1", name: "U", email: "u@x" } },
    organization: { id: ORG_ID },
    membership: { role: "owner" as const },
    _spies: { slotFindMany, slotCount, documentGroupBy },
  };
}

describe("approval router — overdue uses Document.slotId FK", () => {
  let router: Record<string, { _handler: Handler } | undefined>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/server/api/routers/approval");
    router = mod.approvalRouter as unknown as Record<string, { _handler: Handler } | undefined>;
  });

  it("listOverdueSlots queries slots with no bound document (FK), not by positional doc count", async () => {
    const ctx = makeCtx();

    await router.listOverdueSlots!._handler({
      ctx,
      input: { projectId: PROJECT_ID },
    });

    expect(ctx._spies.slotFindMany).toHaveBeenCalledTimes(1);
    const args = ctx._spies.slotFindMany.mock.calls[0]![0] as {
      where: {
        dueDate: { not: null; lt: Date };
        task: { projectId: string };
        documents: { none: object };
      };
    };
    expect(args.where.documents).toEqual({ none: {} });
    expect(args.where.task).toEqual({ projectId: PROJECT_ID });
    expect(args.where.dueDate.lt).toBeInstanceOf(Date);

    // The legacy positional implementation grouped Document by (taskId, folderId)
    // to figure out which slots were filled. That groupBy must not happen any more.
    expect(ctx._spies.documentGroupBy).not.toHaveBeenCalled();
  });

  it("summary's overdue count is driven by the FK-based slot count (no positional groupBy)", async () => {
    const ctx = makeCtx();
    ctx._spies.slotCount.mockResolvedValue(4);

    const result = await router.summary!._handler({
      ctx,
      input: { projectId: PROJECT_ID },
    }) as { overdue: number };

    expect(result.overdue).toBe(4);

    const countArgs = ctx._spies.slotCount.mock.calls[0]![0] as {
      where: {
        dueDate: { not: null; lt: Date };
        task: { projectId: string };
        documents: { none: object };
      };
    };
    expect(countArgs.where.documents).toEqual({ none: {} });
    expect(ctx._spies.documentGroupBy).toHaveBeenCalledTimes(1);
    // groupBy is still used for the pending/approved totals, but its where
    // clause must not be filtering by the legacy positional shape.
    const groupArgs = ctx._spies.documentGroupBy.mock.calls[0]![0] as {
      by: string[];
      where: Record<string, unknown>;
    };
    expect(groupArgs.by).toEqual(["approvalStatus"]);
  });
});
