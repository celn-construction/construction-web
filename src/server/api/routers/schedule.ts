import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, projectProcedure } from "@/server/api/trpc";
import { saveVersionSchema, versionIdSchema } from "@/lib/validations/schedule";
import { hasPermission } from "@/lib/permissions";
import { captureGanttSnapshot } from "@/server/api/helpers/ganttSnapshot";
import type { GanttSnapshot } from "@/server/api/helpers/ganttSnapshot";

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

  return sorted;
}

export const scheduleRouter = createTRPCRouter({
  saveVersion: projectProcedure
    .input(saveVersionSchema)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      const { name } = input;

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

      const snapshot = await captureGanttSnapshot(ctx.db, projectId);

      const result = await ctx.db.scheduleVersion.create({
        data: {
          projectId,
          name,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
          createdById: ctx.session.user.id,
        },
        select: {
          id: true,
          name: true,
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

      const version = await ctx.db.scheduleVersion.findFirst({
        where: { id: versionId, projectId },
        select: {
          id: true,
          name: true,
          snapshot: true,
          createdAt: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      return version;
    }),

  deleteVersion: projectProcedure
    .input(versionIdSchema)
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project.id;
      const { versionId } = input;

      if (!hasPermission(ctx.projectMember.role, "MANAGE_PROJECTS")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to delete versions" });
      }

      const version = await ctx.db.scheduleVersion.findFirst({
        where: { id: versionId, projectId },
      });

      if (!version) {
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

      const version = await ctx.db.scheduleVersion.findFirst({
        where: { id: versionId, projectId },
      });

      if (!version) {
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
                coverImageUrl: task.coverImageUrl as string | null,
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
});
