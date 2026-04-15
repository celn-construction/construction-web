import "server-only";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { Prisma } from "../../../../generated/prisma";
import type { PrismaClient } from "../../../../generated/prisma";
import type { GanttSnapshot } from "./ganttSnapshot";
import type { clientSnapshotSchema } from "@/lib/validations/schedule";

type ClientSnapshot = z.infer<typeof clientSnapshotSchema>;

/**
 * Convert Bryntum's project.inlineData into our GanttSnapshot format.
 * Bryntum inlineData uses "tasks.rows", "dependencies.rows" etc. structure,
 * with Bryntum field names that need mapping to our DB field names.
 */
export function buildSnapshotFromInlineData(
  inlineData: ClientSnapshot,
): GanttSnapshot {
  const rawTasks = inlineData.tasks as Array<Record<string, unknown>>;
  const rawDeps = inlineData.dependencies as Array<Record<string, unknown>>;
  const rawResources = inlineData.resources as Array<Record<string, unknown>>;
  const rawAssignments = inlineData.assignments as Array<Record<string, unknown>>;
  const rawTimeRanges = inlineData.timeRanges as Array<Record<string, unknown>>;

  // Filter out root/virtual records and map Bryntum field names → DB field names
  const tasks = rawTasks
    .filter((t) => !isRootRecord(t))
    .map((t, index) => mapTaskRecord(t, index));

  const dependencies = rawDeps
    .filter((d) => !isPhantomOnly(d))
    .map(mapDependencyRecord);

  const resources = rawResources
    .filter((r) => !isPhantomOnly(r))
    .map(mapResourceRecord);

  const assignments = rawAssignments
    .filter((a) => !isPhantomOnly(a))
    .map(mapAssignmentRecord);

  const timeRanges = rawTimeRanges
    .filter((tr) => !isPhantomOnly(tr))
    .map(mapTimeRangeRecord);

  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    tasks,
    dependencies,
    resources,
    assignments,
    timeRanges,
  };
}

/**
 * Reconcile the DB to match the snapshot — delete all existing records,
 * then insert from the snapshot. This ensures the DB matches the client state
 * after a version save, even for records the CrudManager failed to sync.
 */
export async function reconcileDbFromSnapshot(
  db: PrismaClient,
  projectId: string,
  snapshot: GanttSnapshot,
): Promise<void> {
  await db.$transaction(async (tx) => {
    // Delete in FK-safe order
    await tx.ganttAssignment.deleteMany({ where: { projectId } });
    await tx.ganttDependency.deleteMany({ where: { projectId } });
    await tx.ganttTask.deleteMany({ where: { projectId } });
    await tx.ganttResource.deleteMany({ where: { projectId } });
    await tx.ganttTimeRange.deleteMany({ where: { projectId } });

    // Re-insert tasks (topological order — parents before children)
    const sortedTasks = topologicalSortTasks(snapshot.tasks);
    for (const task of sortedTasks) {
      await tx.ganttTask.create({
        data: {
          id: task.id as string,
          projectId,
          parentId: task.parentId as string | null,
          name: task.name as string,
          percentDone: task.percentDone as number,
          startDate: task.startDate ? new Date(task.startDate as string) : null,
          endDate: task.endDate ? new Date(task.endDate as string) : null,
          duration: task.duration as number | null,
          durationUnit: (task.durationUnit as string) ?? "day",
          effort: task.effort as number | null,
          effortUnit: task.effortUnit as string | null,
          expanded: (task.expanded as boolean) ?? false,
          manuallyScheduled: (task.manuallyScheduled as boolean) ?? false,
          constraintType: task.constraintType as string | null,
          constraintDate: task.constraintDate ? new Date(task.constraintDate as string) : null,
          rollup: (task.rollup as boolean) ?? false,
          cls: task.cls as string | null,
          iconCls: task.iconCls as string | null,
          note: task.note as string | null,
          csiCode: task.csiCode as string | null,
          baselines: task.baselines ? (task.baselines as Prisma.InputJsonValue) : Prisma.JsonNull,
          orderIndex: (task.orderIndex as number) ?? 0,
          version: 1,
          coverImageUrl: task.coverImageUrl as string | null,
        },
      });
    }

    // Re-insert resources
    if (snapshot.resources.length > 0) {
      await tx.ganttResource.createMany({
        data: snapshot.resources.map((r) => ({
          id: r.id as string,
          projectId,
          name: r.name as string,
          city: r.city as string | null,
          calendar: r.calendar as string | null,
          image: r.image as string | null,
        })),
      });
    }

    // Re-insert dependencies
    if (snapshot.dependencies.length > 0) {
      await tx.ganttDependency.createMany({
        data: snapshot.dependencies.map((d) => ({
          id: d.id as string,
          projectId,
          fromTaskId: d.fromTaskId as string,
          toTaskId: d.toTaskId as string,
          type: (d.type as number) ?? 2,
          lag: (d.lag as number) ?? 0,
          lagUnit: d.lagUnit as string | null,
          cls: d.cls as string | null,
        })),
      });
    }

    // Re-insert assignments
    if (snapshot.assignments.length > 0) {
      await tx.ganttAssignment.createMany({
        data: snapshot.assignments.map((a) => ({
          id: a.id as string,
          projectId,
          taskId: a.taskId as string,
          resourceId: a.resourceId as string,
          units: (a.units as number) ?? 100,
        })),
      });
    }

    // Re-insert time ranges
    if (snapshot.timeRanges.length > 0) {
      await tx.ganttTimeRange.createMany({
        data: snapshot.timeRanges.map((tr) => ({
          id: tr.id as string,
          projectId,
          name: tr.name as string,
          startDate: new Date(tr.startDate as string),
          duration: tr.duration as number | null,
          durationUnit: tr.durationUnit as string | null,
          cls: tr.cls as string | null,
        })),
      });
    }
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────

function isRootRecord(r: Record<string, unknown>): boolean {
  // Bryntum's root node has no name and id starts with "_generated" project prefix
  // or has the special isRoot / $PhantomId pattern for the root
  if (r.isRoot === true) return true;
  // Filter out the project root node (parentId undefined, children array present)
  const id = String(r.id ?? "");
  if (id.startsWith("_generatedProjectModel")) return true;
  return false;
}

function isPhantomOnly(r: Record<string, unknown>): boolean {
  // Records with only a $PhantomId and no meaningful data
  return !r.id && !r.$PhantomId;
}

/** Resolve a Bryntum ID — if it's a phantom ID, generate a real CUID. */
function resolveId(raw: unknown): string {
  const id = String(raw ?? "");
  if (id.startsWith("_generated")) return createId();
  return id;
}

function mapTaskRecord(t: Record<string, unknown>, index: number): Record<string, unknown> {
  const id = resolveId(t.id ?? t.$PhantomId);
  // parentId might be a phantom reference — resolve it
  const parentId = t.parentId ? String(t.parentId) : null;

  return {
    id,
    parentId,
    name: t.name ?? "New Task",
    percentDone: t.percentDone ?? 0,
    startDate: t.startDate ?? null,
    endDate: t.endDate ?? null,
    duration: t.duration ?? null,
    durationUnit: t.durationUnit ?? "day",
    effort: t.effort ?? null,
    effortUnit: t.effortUnit ?? null,
    expanded: t.expanded ?? false,
    manuallyScheduled: t.manuallyScheduled ?? false,
    constraintType: t.constraintType ?? null,
    constraintDate: t.constraintDate ?? null,
    rollup: t.rollup ?? false,
    cls: typeof t.cls === "string" ? t.cls : null,
    iconCls: t.iconCls ?? null,
    note: t.note ?? null,
    csiCode: t.csiCode ?? null,
    baselines: t.baselines ?? null,
    orderIndex: t.orderedParentIndex ?? t.parentIndex ?? index,
    version: 1,
    coverImageUrl: t.coverImageUrl ?? null,
  };
}

function mapDependencyRecord(d: Record<string, unknown>): Record<string, unknown> {
  return {
    id: resolveId(d.id ?? d.$PhantomId),
    fromTaskId: String(d.fromTask ?? d.from ?? d.fromTaskId ?? ""),
    toTaskId: String(d.toTask ?? d.to ?? d.toTaskId ?? ""),
    type: d.type ?? 2,
    lag: d.lag ?? 0,
    lagUnit: d.lagUnit ?? null,
    cls: typeof d.cls === "string" ? d.cls : null,
  };
}

function mapResourceRecord(r: Record<string, unknown>): Record<string, unknown> {
  return {
    id: resolveId(r.id ?? r.$PhantomId),
    name: r.name ?? "Resource",
    city: r.city ?? null,
    calendar: r.calendar ?? null,
    image: r.image ?? null,
  };
}

function mapAssignmentRecord(a: Record<string, unknown>): Record<string, unknown> {
  return {
    id: resolveId(a.id ?? a.$PhantomId),
    taskId: String(a.event ?? a.taskId ?? ""),
    resourceId: String(a.resource ?? a.resourceId ?? ""),
    units: a.units ?? 100,
  };
}

function mapTimeRangeRecord(tr: Record<string, unknown>): Record<string, unknown> {
  return {
    id: resolveId(tr.id ?? tr.$PhantomId),
    name: tr.name ?? "Time Range",
    startDate: tr.startDate ?? new Date().toISOString(),
    duration: tr.duration ?? null,
    durationUnit: tr.durationUnit ?? null,
    cls: typeof tr.cls === "string" ? tr.cls : null,
  };
}

function topologicalSortTasks(tasks: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const taskMap = new Map<string, Record<string, unknown>>();
  const childrenMap = new Map<string, string[]>();
  const roots: string[] = [];

  for (const task of tasks) {
    const id = task.id as string;
    taskMap.set(id, task);
    if (!task.parentId) {
      roots.push(id);
    } else {
      const parentId = task.parentId as string;
      const children = childrenMap.get(parentId) ?? [];
      children.push(id);
      childrenMap.set(parentId, children);
    }
  }

  const sorted: Array<Record<string, unknown>> = [];
  const queue = [...roots];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const task = taskMap.get(id);
    if (task) sorted.push(task);
    const children = childrenMap.get(id);
    if (children) queue.push(...children);
  }

  // Append orphans (parentId references non-existent task)
  if (sorted.length < tasks.length) {
    const sortedIds = new Set(sorted.map((t) => t.id as string));
    for (const task of tasks) {
      if (!sortedIds.has(task.id as string)) {
        sorted.push({ ...task, parentId: null });
      }
    }
  }

  return sorted;
}
