// @vitest-environment node
//
// Phase 3 — Slot ↔ Document FK binding.
//
// resolveSlotForUpload is the gatekeeper that converts a client-side intent
// ("upload to this folder, optionally to this slot") into a Document.slotId.
// These tests pin the two modes:
//
//   - Explicit pin (per-slot upload button): caller passes slotId. We
//     validate task and kind match before honoring it.
//   - Auto-link (generic folder dropzone): no slotId. We bind to the
//     lowest-index slot of the matching kind that has no bound document.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveSlotForUpload } from "@/server/api/helpers/uploadSlot";

const TASK_ID = "task-1";
const OTHER_TASK_ID = "task-2";
const SLOT_ID = "slot-A";

type Slot = { id: string; taskId: string; kind: string };

function makeDb(opts: {
  findUniqueResult?: Slot | null;
  findFirstResult?: { id: string } | null;
} = {}) {
  const findUnique = vi.fn().mockResolvedValue(opts.findUniqueResult ?? null);
  const findFirst = vi.fn().mockResolvedValue(opts.findFirstResult ?? null);
  return {
    db: {
      taskRequirementSlot: { findUnique, findFirst },
    },
    findUnique,
    findFirst,
  };
}

describe("resolveSlotForUpload — explicit slotId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the slot id when it belongs to the task and matches the kind", async () => {
    const { db } = makeDb({
      findUniqueResult: { id: SLOT_ID, taskId: TASK_ID, kind: "submittal" },
    });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: SLOT_ID,
    });

    expect(result).toEqual({ ok: true, slotId: SLOT_ID });
  });

  it("rejects when the slot belongs to a different task", async () => {
    const { db } = makeDb({
      findUniqueResult: { id: SLOT_ID, taskId: OTHER_TASK_ID, kind: "submittal" },
    });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: SLOT_ID,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects when the slot's kind doesn't match the upload's folder kind", async () => {
    // User dragged a doc into the Submittals folder but passed an inspection slot's id.
    const { db } = makeDb({
      findUniqueResult: { id: SLOT_ID, taskId: TASK_ID, kind: "inspection" },
    });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: SLOT_ID,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects when the slot id refers to a non-existent slot", async () => {
    const { db } = makeDb({ findUniqueResult: null });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: "nope",
    });

    expect(result.ok).toBe(false);
  });

  it("does not run the auto-link query when an explicit slot id is provided", async () => {
    const { db, findFirst } = makeDb({
      findUniqueResult: { id: SLOT_ID, taskId: TASK_ID, kind: "submittal" },
    });

    await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: SLOT_ID,
    });

    // findFirst is now used both for the occupancy check (explicit path)
    // and the lowest-index lookup (auto-link path). The auto-link call is
    // identified by `orderBy.index === "asc"`. The explicit path must not
    // issue that call.
    const autoLinkCalls = findFirst.mock.calls.filter(([args]) => {
      return (args as { orderBy?: { index?: string } }).orderBy?.index === "asc";
    });
    expect(autoLinkCalls).toHaveLength(0);
  });

  it("rejects when the explicit slot already has a bound document", async () => {
    // Stale UI: another upload bound to this slot between the popover
    // rendering it as empty and the user clicking. Pre-checking avoids
    // burning a blob upload + AI analysis on a doomed create (which the
    // partial unique index would otherwise reject at the DB layer).
    const { db } = makeDb({
      findUniqueResult: { id: SLOT_ID, taskId: TASK_ID, kind: "submittal" },
      findFirstResult: { id: "existing-doc" },
    });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: SLOT_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/already/i);
    }
  });
});

describe("resolveSlotForUpload — auto-link", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the first empty slot's id when one exists", async () => {
    const { db } = makeDb({ findFirstResult: { id: "slot-empty-3" } });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: null,
    });

    expect(result).toEqual({ ok: true, slotId: "slot-empty-3" });
  });

  it("returns slotId=null when every slot of this kind is already bound", async () => {
    // Overflow upload: no slot to auto-link to. The doc still gets created,
    // it just lands unbound. Surface this as ok with slotId=null so the
    // route doesn't fail the upload.
    const { db } = makeDb({ findFirstResult: null });

    const result = await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: null,
    });

    expect(result).toEqual({ ok: true, slotId: null });
  });

  it("queries by ascending slot index — the visible UI order — and scopes to slots with no document", async () => {
    // The popover and drawer render slots ordered by index. Auto-link must
    // bind to the first empty slot the user sees, not a random one.
    const { db, findFirst } = makeDb({ findFirstResult: { id: "slot-empty-0" } });

    await resolveSlotForUpload(db, {
      taskId: TASK_ID,
      slotKind: "submittal",
      explicitSlotId: null,
    });

    const args = findFirst.mock.calls[0]![0] as {
      where: { taskId: string; kind: string; documents: { none: object } };
      orderBy: { index: string };
    };
    expect(args.where.taskId).toBe(TASK_ID);
    expect(args.where.kind).toBe("submittal");
    expect(args.where.documents).toEqual({ none: {} });
    expect(args.orderBy.index).toBe("asc");
  });
});
