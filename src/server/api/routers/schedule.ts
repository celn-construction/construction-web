import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, projectProcedure } from "@/server/api/trpc";
import { saveVersionSchema, versionIdSchema } from "@/lib/validations/schedule";
import { hasPermission } from "@/lib/permissions";
import { captureGanttSnapshot } from "@/server/api/helpers/ganttSnapshot";
import type { GanttSnapshot } from "@/server/api/helpers/ganttSnapshot";
import { buildSnapshotFromInlineData, reconcileDbFromSnapshot } from "@/server/api/helpers/ganttInlineSync";
import type { RevisionSummary } from "@/lib/types/schedule";

const MAX_VERSIONS_PER_PROJECT = 50;

/**
 * Topological sort for tasks with self-referential parentId.
 * Ensures parents are always inserted before their children.
 */
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
    if (task) {
      sorted.push(task);
    }
    const children = childrenMap.get(id);
    if (children) {
      queue.push(...children);
    }
  }

  // Append any orphaned tasks (parentId references a non-existent task)
  // so they are not silently dropped during restore
  if (sorted.length < tasks.length) {
    const sortedIds = new Set(sorted.map((t) => t.id as string));
    for (const task of tasks) {
      if (!sortedIds.has(task.id as string)) {
        // Clear the broken parentId so it can be inserted as a root task
        sorted.push({ ...task, parentId: null });
      }
    }
  }

  return sorted;
}

export const scheduleRouter = createTRPCRouter({
  saveVersion: projectProcedure
    .input(saveVersionSchema)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      // Check version cap
      const versionCount = await ctx.db.scheduleVersion.count({
        where: { projectId },
      });

      if (versionCount >= MAX_VERSIONS_PER_PROJECT) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum of ${MAX_VERSIONS_PER_PROJECT} versions per project. Delete older versions to save new ones.`,
        });
      }

      // Build snapshot from client inlineData if available (captures ALL Bryntum data).
      // Falls back to DB snapshot if client data is missing (timeout fallback).
      let snapshot: GanttSnapshot;
      if (input.clientSnapshot) {
        snapshot = buildSnapshotFromInlineData(input.clientSnapshot);
        // Reconcile the DB so it matches the client state (upsert all, delete missing)
        await reconcileDbFromSnapshot(ctx.db, projectId, snapshot);
      } else {
        snapshot = await captureGanttSnapshot(ctx.db, projectId);
      }

      // Link to the most recent revision so we know which revision this version was saved at
      const latestRevision = await ctx.db.scheduleRevision.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      const result = await ctx.db.scheduleVersion.create({
        data: {
          projectId,
          name: input.name || null,
          description: input.description || null,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
          createdById: ctx.session.user.id,
          revisionId: latestRevision?.id ?? null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
        },
      });
      return result;
    }),

  listVersions: projectProcedure
    .query(async ({ ctx }) => {
      const projectId = ctx.project.id;

      const versions = await ctx.db.scheduleVersion.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      return versions;
    }),

  getVersion: projectProcedure
    .input(versionIdSchema)
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      const { versionId } = input;

      const version = await ctx.db.scheduleVersion.findUnique({
        where: { id: versionId },
        select: {
          id: true,
          name: true,
          description: true,
          snapshot: true,
          createdAt: true,
          projectId: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!version || version.projectId !== projectId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      const { projectId: _, ...versionData } = version;
      return versionData;
    }),

  deleteVersion: projectProcedure
    .input(versionIdSchema)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      const { versionId } = input;

      if (!hasPermission(ctx.projectMember.role, "MANAGE_PROJECTS")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to delete versions" });
      }

      const version = await ctx.db.scheduleVersion.findUnique({
        where: { id: versionId },
      });

      if (!version || version.projectId !== projectId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      await ctx.db.scheduleVersion.delete({
        where: { id: versionId },
      });

      return { success: true };
    }),

  restoreVersion: projectProcedure
    .input(versionIdSchema)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      const { versionId } = input;

      if (!hasPermission(ctx.projectMember.role, "MANAGE_PROJECTS")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to restore versions" });
      }

      const version = await ctx.db.scheduleVersion.findUnique({
        where: { id: versionId },
      });

      if (!version || version.projectId !== projectId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      const snapshot = version.snapshot as unknown as GanttSnapshot;

      await ctx.db.$transaction(async (tx) => {
        // 1. Delete all current Gantt data (order matters for FK constraints)
        await tx.ganttAssignment.deleteMany({ where: { projectId } });
        await tx.ganttDependency.deleteMany({ where: { projectId } });
        await tx.ganttTask.deleteMany({ where: { projectId } });
        await tx.ganttResource.deleteMany({ where: { projectId } });
        await tx.ganttTimeRange.deleteMany({ where: { projectId } });

        // 2. Re-insert from snapshot
        if (snapshot.tasks.length > 0) {
          // Topological sort ensures parents are inserted before children
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
                baselines: (task.baselines as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                orderIndex: (task.orderIndex as number) ?? 0,
                version: (task.version as number) ?? 1,
                coverDocumentId: (task.coverDocumentId as string | null) ?? null,
              },
            });
          }
        }

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

      return { success: true };
    }),

  /**
   * List revisions (change history) for a project.
   * Returns compact summaries, not full change data.
   */
  listRevisions: projectProcedure
    .input(z.object({
      cursor: z.string().datetime().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional().default({}))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      const { cursor, limit } = input;

      const revisions = await ctx.db.scheduleRevision.findMany({
        where: {
          projectId,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1, // Fetch one extra to detect hasMore
        select: {
          id: true,
          createdAt: true,
          summary: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const hasMore = revisions.length > limit;
      if (hasMore) revisions.pop();

      return {
        revisions: revisions.map((r) => ({
          ...r,
          summary: r.summary as unknown as RevisionSummary | null,
        })),
        nextCursor: hasMore ? revisions[revisions.length - 1]?.createdAt.toISOString() : undefined,
      };
    }),

  /**
   * Get full change details for a specific revision.
   */
  getRevision: projectProcedure
    .input(z.object({ revisionId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project.id;

      const revision = await ctx.db.scheduleRevision.findUnique({
        where: { id: input.revisionId },
        select: {
          id: true,
          projectId: true,
          createdAt: true,
          changes: true,
          summary: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!revision || revision.projectId !== projectId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Revision not found" });
      }

      return {
        id: revision.id,
        createdAt: revision.createdAt,
        changes: revision.changes,
        summary: revision.summary as unknown as RevisionSummary | null,
        createdBy: revision.createdBy,
      };
    }),

  /**
   * Diff between two versions: returns all revisions between them.
   * Useful for answering "what changed between v3 and v5?"
   */
  diffVersions: projectProcedure
    .input(z.object({
      fromVersionId: z.string().cuid(),
      toVersionId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project.id;

      // Fetch both versions to get their timestamps
      const [fromVersion, toVersion] = await Promise.all([
        ctx.db.scheduleVersion.findUnique({
          where: { id: input.fromVersionId },
          select: { id: true, projectId: true, createdAt: true, name: true },
        }),
        ctx.db.scheduleVersion.findUnique({
          where: { id: input.toVersionId },
          select: { id: true, projectId: true, createdAt: true, name: true },
        }),
      ]);

      if (!fromVersion || fromVersion.projectId !== projectId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Source version not found" });
      }
      if (!toVersion || toVersion.projectId !== projectId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Target version not found" });
      }

      // Ensure from < to chronologically
      const [earlier, later] = fromVersion.createdAt <= toVersion.createdAt
        ? [fromVersion, toVersion]
        : [toVersion, fromVersion];

      // Get all revisions between the two version timestamps
      const revisions = await ctx.db.scheduleRevision.findMany({
        where: {
          projectId,
          createdAt: {
            gt: earlier.createdAt,
            lte: later.createdAt,
          },
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          summary: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Aggregate totals across all revisions
      let totalTasksAdded = 0, totalTasksModified = 0, totalTasksRemoved = 0;
      let totalDepsAdded = 0, totalDepsModified = 0, totalDepsRemoved = 0;

      for (const rev of revisions) {
        const s = rev.summary as unknown as RevisionSummary | null;
        if (!s) continue;
        totalTasksAdded += s.tasksAdded;
        totalTasksModified += s.tasksModified;
        totalTasksRemoved += s.tasksRemoved;
        totalDepsAdded += s.dependenciesAdded;
        totalDepsModified += s.dependenciesModified;
        totalDepsRemoved += s.dependenciesRemoved;
      }

      return {
        from: { id: earlier.id, name: earlier.name, createdAt: earlier.createdAt },
        to: { id: later.id, name: later.name, createdAt: later.createdAt },
        revisionCount: revisions.length,
        summary: {
          tasksAdded: totalTasksAdded,
          tasksModified: totalTasksModified,
          tasksRemoved: totalTasksRemoved,
          dependenciesAdded: totalDepsAdded,
          dependenciesModified: totalDepsModified,
          dependenciesRemoved: totalDepsRemoved,
        },
        revisions: revisions.map((r) => ({
          ...r,
          summary: r.summary as unknown as RevisionSummary | null,
        })),
      };
    }),
});
