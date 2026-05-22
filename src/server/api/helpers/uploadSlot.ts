import type { SlotKind } from "@/lib/validations/gantt";

export type ResolveSlotResult =
  | { ok: true; slotId: string | null }
  | { ok: false; error: string };

// Structural type narrow enough to accept the real PrismaClient AND a
// vitest mock with just these two methods. Avoids importing the full
// generated delegate type into tests.
type SlotResolverDb = {
  taskRequirementSlot: {
    findUnique: (args: {
      where: { id: string };
      select: { id: true; taskId: true; kind: true };
    }) => Promise<{ id: string; taskId: string; kind: string } | null>;
    findFirst: (args: {
      where: {
        id?: string;
        taskId?: string;
        kind?: SlotKind;
        documents?: { none?: Record<string, never>; some?: Record<string, never> };
      };
      orderBy?: { index: "asc" };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
};

/**
 * Determines the TaskRequirementSlot a new upload should bind to via
 * Document.slotId, given an optional explicit slotId from the client.
 *
 * - If the caller passed an `explicitSlotId` (per-slot upload button): verify
 *   the slot exists, belongs to this task, and matches the kind implied by
 *   the upload's folder. Mismatches return an error so the upload aborts.
 * - Otherwise (generic folder dropzone): auto-link to the lowest-index slot
 *   that has no bound document yet.
 * - If every slot of this kind is already full, the upload lands unbound
 *   (slotId = null). The doc still exists in the folder — it just doesn't
 *   satisfy any slot's requirement.
 */
export async function resolveSlotForUpload(
  db: SlotResolverDb,
  args: { taskId: string; slotKind: SlotKind; explicitSlotId: string | null },
): Promise<ResolveSlotResult> {
  const { taskId, slotKind, explicitSlotId } = args;

  if (explicitSlotId) {
    const slot = await db.taskRequirementSlot.findUnique({
      where: { id: explicitSlotId },
      select: { id: true, taskId: true, kind: true },
    });
    if (!slot || slot.taskId !== taskId || slot.kind !== slotKind) {
      return { ok: false, error: "Invalid slot for this task and folder" };
    }
    // Reject if the slot is already bound. The partial unique index on
    // Document.slotId catches this at the DB layer too, but pre-checking
    // here avoids burning a blob upload + AI analysis on a doomed create.
    const occupied = await db.taskRequirementSlot.findFirst({
      where: { id: slot.id, documents: { some: {} } },
      select: { id: true },
    });
    if (occupied) {
      return { ok: false, error: "Slot already has a document" };
    }
    return { ok: true, slotId: slot.id };
  }

  const empty = await db.taskRequirementSlot.findFirst({
    where: {
      taskId,
      kind: slotKind,
      documents: { none: {} },
    },
    orderBy: { index: "asc" },
    select: { id: true },
  });
  return { ok: true, slotId: empty?.id ?? null };
}
