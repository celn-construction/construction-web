// @vitest-environment node
import { describe, it, expect } from "vitest";
import { reconcileSyncPack } from "./reconcileSyncPack";

// Mimic Bryntum's Store/Record API surface that reconcileSyncPack actually touches.
function makeTaskStore(
  records: Record<string, { data: Record<string, unknown>; $PhantomId?: string }>,
) {
  return {
    getById: (id: string) => records[id] ?? null,
  };
}

describe("reconcileSyncPack — added-task injection", () => {
  it("no-ops when Bryntum's bag already contains the pending id", () => {
    const pack = {
      tasks: {
        added: [{ id: "_phant_1", $PhantomId: "_phant_1", name: "Task A" }],
      },
    };
    const taskStore = makeTaskStore({
      _phant_1: { data: { id: "_phant_1", $PhantomId: "_phant_1", name: "Task A" } },
    });

    reconcileSyncPack(pack, taskStore, new Set(["_phant_1"]), new Set());

    expect(pack.tasks.added).toHaveLength(1);
  });

  it("injects a missing added record from the taskStore into the pack", () => {
    const pack: { tasks?: { added?: Array<Record<string, unknown>> } } = {
      tasks: { added: [] },
    };
    const taskStore = makeTaskStore({
      _phant_1: {
        data: {
          id: "_phant_1",
          $PhantomId: "_phant_1",
          name: "Task A",
          startDate: "2026-05-14T00:00:00.000Z",
          duration: 1,
        },
      },
    });

    reconcileSyncPack(pack, taskStore, new Set(["_phant_1"]), new Set());

    expect(pack.tasks?.added).toHaveLength(1);
    const injected = pack.tasks!.added![0]!;

    // The critical assertion: the injected record MUST carry $PhantomId so the
    // server can return a phantom→real id mapping back to the client. Without
    // this, the local Bryntum record stays phantom and gets re-added on the
    // next sync (silent autosave failure / duplicate task symptom).
    expect(injected.$PhantomId).toBe("_phant_1");

    // Sanity: the rest of the data should also come through
    expect(injected.name).toBe("Task A");
    expect(injected.duration).toBe(1);
  });

  it("creates the tasks.added array if the pack arrived without one", () => {
    const pack: { tasks?: { added?: Array<Record<string, unknown>> } } = {};
    const taskStore = makeTaskStore({
      _phant_1: {
        data: { id: "_phant_1", $PhantomId: "_phant_1", name: "Lonely" },
      },
    });

    reconcileSyncPack(pack, taskStore, new Set(["_phant_1"]), new Set());

    expect(pack.tasks?.added).toHaveLength(1);
    expect(pack.tasks!.added![0]!.$PhantomId).toBe("_phant_1");
  });

  // When $PhantomId isn't on record.data, reconcileSyncPack reads it from the
  // record object directly. The outgoing pack carries $PhantomId so the server
  // can echo a phantom→real id mapping; without it Bryntum's afterSyncAttempt
  // crashes trying to materialize an undefined record (the "silent autosave
  // failure" symptom).
  it("injects $PhantomId from the record object when record.data doesn't carry it", () => {
    const pack: { tasks?: { added?: Array<Record<string, unknown>> } } = {
      tasks: { added: [] },
    };
    const taskStore = makeTaskStore({
      _phant_1: {
        $PhantomId: "_phant_1",
        data: { id: "_phant_1", name: "Task A" },
      },
    });

    reconcileSyncPack(pack, taskStore, new Set(["_phant_1"]), new Set());

    const injected = pack.tasks!.added![0]!;
    expect(injected.$PhantomId).toBe("_phant_1");
  });

  // Last-resort fallback: if $PhantomId is missing on both record.data and the
  // record object, reconcileSyncPack uses the local id from pendingAddedIds so
  // the server still gets a phantom marker it can echo back.
  it("falls back to the local id when $PhantomId is missing on both record and record.data", () => {
    const pack: { tasks?: { added?: Array<Record<string, unknown>> } } = {
      tasks: { added: [] },
    };
    const taskStore = makeTaskStore({
      _phant_1: {
        data: { id: "_phant_1", name: "Task A" },
      },
    });

    reconcileSyncPack(pack, taskStore, new Set(["_phant_1"]), new Set());

    const injected = pack.tasks!.added![0]!;
    expect(injected.$PhantomId).toBe("_phant_1");
  });
});
