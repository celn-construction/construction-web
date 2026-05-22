// @vitest-environment node
//
// Regression coverage for the slot ↔ legacy-count invariant.
//
// Before Phase 1, GanttTask.requiredSubmittals / requiredInspections could be
// mutated via two procedures: `gantt.updateRequirement` (legacy, popover) which
// touched only the integer column, and `gantt.setSlotCount` (drawer) which
// updated both the integer column AND the TaskRequirementSlot rows in one
// transaction. The two paths could desync — a popover decrement would orphan
// slot rows with names/dueDates/approvers that silently reappeared on the next
// increment.
//
// Post Phase 1, `updateRequirement` is removed and `setSlotCount` is the only
// path. These tests assert both halves of that invariant.

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
const TASK_ID = "task-1";

type MockTx = {
  taskRequirementSlot: {
    findMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  ganttTask: {
    update: ReturnType<typeof vi.fn>;
  };
};

function makeCtx(existingSlots: Array<{ id: string; index: number; name: string | null }> = []) {
  const finalSlots = [...existingSlots];

  const tx: MockTx = {
    taskRequirementSlot: {
      findMany: vi.fn().mockImplementation(({ select }: { select?: Record<string, boolean> } = {}) => {
        if (select) {
          return Promise.resolve(
            finalSlots.map((s) => {
              const picked: Record<string, unknown> = {};
              if (select.id) picked.id = s.id;
              if (select.index) picked.index = s.index;
              if (select.name) picked.name = s.name;
              return picked;
            }),
          );
        }
        return Promise.resolve(finalSlots.map((s) => ({ ...s, approver: null })));
      }),
      createMany: vi.fn().mockImplementation(({ data }: { data: Array<{ index: number; name: string | null }> }) => {
        for (const row of data) {
          finalSlots.push({ id: `slot-${row.index}`, index: row.index, name: row.name });
        }
        return Promise.resolve({ count: data.length });
      }),
      deleteMany: vi.fn().mockImplementation(({ where }: { where: { id: { in: string[] } } }) => {
        const ids = new Set(where.id.in);
        for (let i = finalSlots.length - 1; i >= 0; i--) {
          if (ids.has(finalSlots[i]!.id)) finalSlots.splice(i, 1);
        }
        return Promise.resolve({ count: ids.size });
      }),
    },
    ganttTask: {
      update: vi.fn().mockResolvedValue({}),
    },
  };

  return {
    tx,
    finalSlots,
    db: {
      ganttTask: {
        findFirst: vi.fn().mockResolvedValue({ id: TASK_ID }),
      },
      $transaction: vi.fn(async (fn: (tx: MockTx) => Promise<unknown>) => fn(tx)),
    },
    session: { user: { id: "user-1" } },
    organization: { id: ORG_ID },
    membership: { role: "owner" as const },
  };
}

describe("gantt router — slot/count invariant", () => {
  let router: Record<string, { _handler: Handler } | undefined>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/server/api/routers/gantt");
    router = mod.ganttRouter as unknown as Record<string, { _handler: Handler } | undefined>;
  });

  it("does not expose the legacy updateRequirement procedure", () => {
    // Phase 1 removes the legacy path so the popover and the drawer share one
    // mutation. If this assertion fails, two paths exist again and the slot
    // table can desync from the count column.
    expect(router.updateRequirement).toBeUndefined();
  });

  it("setSlotCount writes both the count column and slot rows in a single transaction (increase)", async () => {
    const ctx = makeCtx([]);

    await router.setSlotCount!._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        taskId: TASK_ID,
        kind: "submittal",
        count: 3,
      },
    });

    expect(ctx.db.$transaction).toHaveBeenCalledTimes(1);
    expect(ctx.tx.taskRequirementSlot.createMany).toHaveBeenCalledTimes(1);
    const createArgs = ctx.tx.taskRequirementSlot.createMany.mock.calls[0]![0] as {
      data: Array<{ taskId: string; kind: string; index: number }>;
    };
    expect(createArgs.data).toHaveLength(3);
    expect(createArgs.data.map((d) => d.index)).toEqual([0, 1, 2]);

    expect(ctx.tx.ganttTask.update).toHaveBeenCalledTimes(1);
    const updateArgs = ctx.tx.ganttTask.update.mock.calls[0]![0] as {
      where: { id: string };
      data: Record<string, unknown>;
    };
    expect(updateArgs.where.id).toBe(TASK_ID);
    expect(updateArgs.data).toEqual({ requiredSubmittals: 3 });
  });

  it("setSlotCount trims slot rows AND updates the count column when decreasing", async () => {
    const ctx = makeCtx([
      { id: "slot-0", index: 0, name: "Shop Drawing" },
      { id: "slot-1", index: 1, name: "Product Data" },
      { id: "slot-2", index: 2, name: "Cert" },
    ]);

    await router.setSlotCount!._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        taskId: TASK_ID,
        kind: "submittal",
        count: 1,
      },
    });

    expect(ctx.tx.taskRequirementSlot.deleteMany).toHaveBeenCalledTimes(1);
    const deleteArgs = ctx.tx.taskRequirementSlot.deleteMany.mock.calls[0]![0] as {
      where: { id: { in: string[] } };
    };
    expect(deleteArgs.where.id.in.sort()).toEqual(["slot-1", "slot-2"]);

    expect(ctx.tx.ganttTask.update).toHaveBeenCalledTimes(1);
    const updateArgs = ctx.tx.ganttTask.update.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(updateArgs.data).toEqual({ requiredSubmittals: 1 });
  });

  it("setSlotCount clears the count column (sets to null) when count is 0", async () => {
    const ctx = makeCtx([{ id: "slot-0", index: 0, name: "Shop Drawing" }]);

    await router.setSlotCount!._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        taskId: TASK_ID,
        kind: "submittal",
        count: 0,
      },
    });

    const updateArgs = ctx.tx.ganttTask.update.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(updateArgs.data).toEqual({ requiredSubmittals: null });
  });

  it("setSlotCount routes inspections to the requiredInspections column", async () => {
    const ctx = makeCtx([]);

    await router.setSlotCount!._handler({
      ctx,
      input: {
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        taskId: TASK_ID,
        kind: "inspection",
        count: 2,
      },
    });

    const updateArgs = ctx.tx.ganttTask.update.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(updateArgs.data).toEqual({ requiredInspections: 2 });
    const createArgs = ctx.tx.taskRequirementSlot.createMany.mock.calls[0]![0] as {
      data: Array<{ kind: string }>;
    };
    expect(createArgs.data.every((d) => d.kind === "inspection")).toBe(true);
  });
});
