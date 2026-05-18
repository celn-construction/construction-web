// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the tRPC module so procedures become passthrough chains exposing `_handler`.
// IMPORTANT: `.query()` / `.mutation()` must return a NEW object so that routers
// with many procedures (like ganttRouter) don't share a single mutated chain.
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

type Handler = (args: { ctx: ReturnType<typeof makeCtx>; input: unknown }) => Promise<{
  success: boolean;
  tasks: { rows: Array<{ $PhantomId?: string; id: string }> };
}>;

const ORG_ID = "org-1";
const PROJECT_ID = "proj-1";

type MockTx = {
  ganttTask: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  ganttDependency: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
  ganttResource: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
  ganttAssignment: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
  ganttTimeRange: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
};

function makeCtx() {
  const tx: MockTx = {
    ganttTask: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({ id: "real-existing" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    ganttDependency: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ganttResource: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ganttAssignment: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ganttTimeRange: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };

  return {
    tx,
    db: {
      project: {
        findFirst: vi.fn().mockResolvedValue({
          id: PROJECT_ID,
          organizationId: ORG_ID,
        }),
      },
      $transaction: vi.fn(async (fn: (tx: MockTx) => Promise<unknown>) => fn(tx)),
    },
    session: { user: { id: "user-1", email: "u@example.com" } },
    organization: { id: ORG_ID },
    membership: { role: "owner" as const },
  };
}

describe("gantt.sync — add task", () => {
  let sync: { _handler: Handler };

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/server/api/routers/gantt");
    const router = mod.ganttRouter as unknown as Record<string, typeof sync>;
    sync = router.sync!;
  });

  it("creates a DB row when Bryntum sends a single added task (the toolbar-click case)", async () => {
    const ctx = makeCtx();
    const now = new Date("2026-05-14T00:00:00.000Z");
    const tomorrow = new Date("2026-05-15T00:00:00.000Z");

    const result = await sync._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        tasks: {
          added: [
            {
              $PhantomId: "_phant_1",
              name: "New Task",
              startDate: now,
              endDate: tomorrow,
              duration: 1,
            },
          ],
        },
      },
    });

    expect(ctx.tx.ganttTask.create).toHaveBeenCalledTimes(1);

    const createArgs = ctx.tx.ganttTask.create.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      projectId: PROJECT_ID,
      name: "New Task",
      duration: 1,
      parentId: null,
    });
    expect(createArgs.data.id).toEqual(expect.any(String));
    expect(createArgs.data.startDate).toEqual(now);
    expect(createArgs.data.endDate).toEqual(tomorrow);

    expect(result.success).toBe(true);
    expect(result.tasks.rows).toHaveLength(1);
    expect(result.tasks.rows[0]).toMatchObject({
      $PhantomId: "_phant_1",
      id: expect.any(String),
    });
    // The real DB ID must NOT equal the phantom ID — that would mean swap failed
    expect(result.tasks.rows[0]!.id).not.toBe("_phant_1");
  });

  it("defaults missing name to 'New Task' (matches handleAddTask omitting fields)", async () => {
    const ctx = makeCtx();

    await sync._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        tasks: {
          added: [{ $PhantomId: "_phant_x" }],
        },
      },
    });

    expect(ctx.tx.ganttTask.create).toHaveBeenCalledTimes(1);
    const createArgs = ctx.tx.ganttTask.create.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data.name).toBe("New Task");
  });

  it("resolves a child's phantom parentId to the parent's real ID within one batch", async () => {
    const ctx = makeCtx();

    await sync._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        tasks: {
          added: [
            { $PhantomId: "_parent", name: "Parent" },
            { $PhantomId: "_child", name: "Child", parentId: "_parent" },
          ],
        },
      },
    });

    expect(ctx.tx.ganttTask.create).toHaveBeenCalledTimes(2);

    // Find the create call that corresponds to the parent (parentId === null)
    // and the one that corresponds to the child (parentId !== null).
    const callsData = ctx.tx.ganttTask.create.mock.calls.map(
      (c) => (c[0] as { data: Record<string, unknown> }).data,
    );
    const parentCall = callsData.find((d) => d.name === "Parent");
    const childCall = callsData.find((d) => d.name === "Child");

    expect(parentCall).toBeDefined();
    expect(childCall).toBeDefined();
    expect(parentCall!.parentId).toBeNull();
    // Child's parentId should equal the parent's real generated ID, NOT the phantom string
    expect(childCall!.parentId).toBe(parentCall!.id);
    expect(childCall!.parentId).not.toBe("_parent");
  });

  it("nulls parentId when the referenced parent does not exist (orphan defense)", async () => {
    const ctx = makeCtx();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sync._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        tasks: {
          added: [
            {
              $PhantomId: "_orphan",
              name: "Orphan",
              parentId: "ghost-parent-id-that-does-not-exist",
            },
          ],
        },
      },
    });

    const createArgs = ctx.tx.ganttTask.create.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data.parentId).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Orphan parentId"),
      expect.objectContaining({ unresolvedParentId: "ghost-parent-id-that-does-not-exist" }),
    );

    warnSpy.mockRestore();
  });
});
