import "server-only";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";

type DbClient = Omit<Prisma.TransactionClient, never>;

export interface GanttSnapshot {
  schemaVersion: 1;
  capturedAt: string;
  tasks: Array<Record<string, unknown>>;
  dependencies: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
  assignments: Array<Record<string, unknown>>;
  timeRanges: Array<Record<string, unknown>>;
}

const MAX_SNAPSHOT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Capture a full snapshot of all Gantt data for a project.
 * Returns the raw DB records (not Bryntum-mapped) so restore can use createMany directly.
 */
export async function captureGanttSnapshot(
  db: DbClient,
  projectId: string,
): Promise<GanttSnapshot> {
  const [tasks, dependencies, resources, assignments, timeRanges] = await Promise.all([
    db.ganttTask.findMany({
      where: { projectId },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        parentId: true,
        name: true,
        percentDone: true,
        startDate: true,
        endDate: true,
        duration: true,
        durationUnit: true,
        effort: true,
        effortUnit: true,
        expanded: true,
        manuallyScheduled: true,
        constraintType: true,
        constraintDate: true,
        rollup: true,
        cls: true,
        iconCls: true,
        note: true,
        csiCode: true,
        baselines: true,
        orderIndex: true,
        version: true,
        coverDocumentId: true,
      },
    }),
    db.ganttDependency.findMany({
      where: { projectId },
      select: {
        id: true,
        fromTaskId: true,
        toTaskId: true,
        type: true,
        lag: true,
        lagUnit: true,
        cls: true,
      },
    }),
    db.ganttResource.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        city: true,
        calendar: true,
        image: true,
      },
    }),
    db.ganttAssignment.findMany({
      where: { projectId },
      select: {
        id: true,
        taskId: true,
        resourceId: true,
        units: true,
      },
    }),
    db.ganttTimeRange.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        startDate: true,
        duration: true,
        durationUnit: true,
        cls: true,
      },
    }),
  ]);

  const snapshot: GanttSnapshot = {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    tasks: tasks as unknown as Array<Record<string, unknown>>,
    dependencies: dependencies as unknown as Array<Record<string, unknown>>,
    resources: resources as unknown as Array<Record<string, unknown>>,
    assignments: assignments as unknown as Array<Record<string, unknown>>,
    timeRanges: timeRanges as unknown as Array<Record<string, unknown>>,
  };

  // Validate size
  const jsonSize = Buffer.byteLength(JSON.stringify(snapshot), "utf-8");
  if (jsonSize > MAX_SNAPSHOT_SIZE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Snapshot too large (${Math.round(jsonSize / 1024 / 1024)}MB). Maximum is 5MB.`,
    });
  }

  return snapshot;
}
