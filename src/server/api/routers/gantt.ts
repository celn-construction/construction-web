import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { ganttLoadInputSchema, ganttSyncInputSchema, updateRequirementSchema } from "@/lib/validations/gantt";
import { CSI_SUBDIVISION_MAP, CSI_DIVISION_MAP } from "@/lib/constants/csiCodes";
import { buildTaskTree, mapDependencyToGantt, mapResourceToGantt, mapAssignmentToGantt, mapTimeRangeToGantt } from "@/server/api/helpers/ganttTree";
import { syncTasks, syncDependencies, syncResources, syncAssignments, syncTimeRanges, VersionConflictError } from "@/server/api/helpers/ganttSync";
import { recordRevision } from "@/server/api/helpers/ganttRevision";
import type { RevisionChanges } from "@/server/api/helpers/ganttRevision";
import { ganttCoverProxyUrl } from "@/lib/blobProxy";

export const ganttRouter = createTRPCRouter({
  /**
   * Lightweight task list for the file tree sidebar
   */
  tasks: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      const project = await ctx.db.project.findFirst({
        where: { id: projectId, organizationId: ctx.organization.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }

      return ctx.db.ganttTask.findMany({
        where: { projectId },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          parentId: true,
          name: true,
          percentDone: true,
        },
      });
    }),

  /**
   * Get single task details for the detail panel
   */
  taskDetail: orgProcedure
    .input(z.object({ projectId: z.string(), taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, taskId } = input;

      const project = await ctx.db.project.findFirst({
        where: { id: projectId, organizationId: ctx.organization.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }

      const task = await ctx.db.ganttTask.findFirst({
        where: { id: taskId, projectId },
        select: {
          id: true,
          name: true,
          percentDone: true,
          startDate: true,
          endDate: true,
          duration: true,
          durationUnit: true,
          coverImageUrl: true,
          csiCode: true,
          requiredSubmittals: true,
          requiredInspections: true,
          parentId: true,
          parent: {
            select: { name: true },
          },
        },
      });

      if (!task) {
        return null;
      }

      return {
        id: task.id,
        name: task.name,
        percentDone: task.percentDone,
        startDate: task.startDate,
        endDate: task.endDate,
        duration: task.duration,
        durationUnit: task.durationUnit,
        coverImageUrl: task.coverImageUrl ? ganttCoverProxyUrl(task.id) : null,
        csiCode: task.csiCode,
        requiredSubmittals: task.requiredSubmittals,
        requiredInspections: task.requiredInspections,
        group: task.parent?.name ?? null,
      };
    }),

  /**
   * Load all Gantt data for a project
   */
  load: orgProcedure
    .input(ganttLoadInputSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      // Verify project belongs to organization
      const project = await ctx.db.project.findFirst({
        where: {
          id: projectId,
          organizationId: ctx.organization.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }

      // Fetch all Gantt data in parallel with optimized queries
      const [tasks, dependencies, resources, assignments, timeRanges] = await Promise.all([
        ctx.db.ganttTask.findMany({
          where: { projectId },
          orderBy: { orderIndex: "asc" },
          // Only select fields needed by Bryntum
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
          },
        }),
        ctx.db.ganttDependency.findMany({
          where: { projectId },
        }),
        ctx.db.ganttResource.findMany({
          where: { projectId },
        }),
        ctx.db.ganttAssignment.findMany({
          where: { projectId },
        }),
        ctx.db.ganttTimeRange.findMany({
          where: { projectId },
        }),
      ]);

      // Build hierarchical task tree
      const taskTree = buildTaskTree(tasks);

      // Map other entities to Gantt format
      const ganttDependencies = dependencies.map(mapDependencyToGantt);
      const ganttResources = resources.map(mapResourceToGantt);
      const ganttAssignments = assignments.map(mapAssignmentToGantt);
      const ganttTimeRanges = timeRanges.map(mapTimeRangeToGantt);

      // Build project config — only include startDate when it has a value.
      // Sending undefined/null for startDate or endDate can confuse the
      // scheduling engine and trigger degenerate time-axis recalculations.
      const projectData: Record<string, unknown> = {
        calendar: project.calendarId,
        hoursPerDay: project.hoursPerDay,
        daysPerWeek: project.daysPerWeek,
        daysPerMonth: project.daysPerMonth,
      };
      if (project.startDate) {
        projectData.startDate = project.startDate.toISOString();
      }

      // Provide a default calendar that marks Sat/Sun as non-working so the
      // Gantt `nonWorkingTime` feature shades weekend columns. Projects that
      // have their own calendars override this via the `calendars` JSON column.
      const defaultCalendars = {
        rows: [
          {
            id: project.calendarId,
            name: "General",
            intervals: [
              {
                recurrentStartDate: "on Sat at 0:00",
                recurrentEndDate: "on Mon at 0:00",
                isWorking: false,
              },
            ],
          },
        ],
      };

      return {
        success: true,
        project: projectData,
        calendars: project.calendars ?? defaultCalendars,
        tasks: { rows: taskTree },
        dependencies: { rows: ganttDependencies },
        resources: { rows: ganttResources },
        assignments: { rows: ganttAssignments },
        timeRanges: { rows: ganttTimeRanges },
      };
    }),

  /**
   * Sync changes to Gantt data
   */
  sync: orgProcedure
    .input(ganttSyncInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { projectId, tasks, dependencies, resources, assignments, timeRanges } = input;

      // Verify project belongs to organization
      const project = await ctx.db.project.findFirst({
        where: {
          id: projectId,
          organizationId: ctx.organization.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }

      try {
        // RepeatableRead isolation eliminates TOCTOU race between version check and update.
        // If another transaction modifies the same row between our read and write,
        // PostgreSQL raises a serialization error (P2034) which we catch below.
        const result = await ctx.db.$transaction(
          async (tx) => {
            const phantomIdMap = new Map<string, string>();

            // Process changes in dependency order:
            // 1. Tasks first (dependencies need task IDs)
            // 2. Resources (assignments need resource IDs)
            // 3. Dependencies (need task IDs)
            // 4. Assignments (need task + resource IDs)
            // 5. Time ranges (independent)

            const taskResult = await syncTasks(tx, projectId, tasks, phantomIdMap);
            const resourceResult = await syncResources(tx, projectId, resources, phantomIdMap);
            const dependencyResult = await syncDependencies(tx, projectId, dependencies, phantomIdMap);
            const assignmentResult = await syncAssignments(tx, projectId, assignments, phantomIdMap);
            const timeRangeResult = await syncTimeRanges(tx, projectId, timeRanges, phantomIdMap);

            return {
              success: true,
              tasks: taskResult,
              resources: resourceResult,
              dependencies: dependencyResult,
              assignments: assignmentResult,
              timeRanges: timeRangeResult,
            };
          },
          { isolationLevel: 'RepeatableRead' },
        );

        // Record a revision delta (fire-and-forget, non-blocking).
        // This runs outside the RepeatableRead transaction so it doesn't
        // hold locks or affect sync latency.
        const syncPayload: RevisionChanges = {
          tasks, dependencies, resources, assignments, timeRanges,
        };
        void recordRevision(ctx.db, projectId, ctx.session.user.id, syncPayload)
          .catch((err) => console.error("Failed to record revision:", err));

        return result;
      } catch (error) {
        if (error instanceof VersionConflictError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        // P2034 = serialization failure from RepeatableRead (concurrent row modification)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Another user modified this data. Please reload and try again.",
          });
        }
        throw error;
      }
    }),

  /**
   * Update a task's CSI code from the detail popover
   */
  updateCsiCode: orgProcedure
    .input(z.object({
      projectId: z.string(),
      taskId: z.string(),
      csiCode: z.string().nullable().refine(
        (val) => val === null || CSI_SUBDIVISION_MAP.has(val) || CSI_DIVISION_MAP.has(val),
        { message: "Invalid CSI code" },
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, taskId, csiCode } = input;

      const project = await ctx.db.project.findFirst({
        where: { id: projectId, organizationId: ctx.organization.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }

      const task = await ctx.db.ganttTask.findFirst({
        where: { id: taskId, projectId },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found in this project" });
      }

      return ctx.db.ganttTask.update({
        where: { id: taskId },
        data: { csiCode },
        select: { id: true, csiCode: true },
      });
    }),

  /**
   * Update a task's required submittal/inspection count
   */
  updateRequirement: orgProcedure
    .input(z.object({ projectId: z.string() }).merge(updateRequirementSchema))
    .mutation(async ({ ctx, input }) => {
      const { projectId, taskId, field, count } = input;

      if (ctx.membership.role !== "owner" && ctx.membership.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners and admins can set requirements" });
      }

      const task = await ctx.db.ganttTask.findFirst({
        where: { id: taskId, projectId, project: { organizationId: ctx.organization.id } },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found in this project" });
      }

      return ctx.db.ganttTask.update({
        where: { id: taskId },
        data: { [field]: count },
        select: { id: true, requiredSubmittals: true, requiredInspections: true },
      });
    }),

  /**
   * Project-wide requirement stats for the toolbar progress card.
   * Returns total required and total uploaded across all tasks.
   */
  requirementStats: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      const project = await ctx.db.project.findFirst({
        where: { id: projectId, organizationId: ctx.organization.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found or access denied" });
      }

      // Get the latest task end date and all tasks with requirements in parallel
      const [latestEndDate, tasksWithReqs] = await Promise.all([
        ctx.db.ganttTask.aggregate({
          where: { projectId, endDate: { not: null } },
          _max: { endDate: true },
        }),
        ctx.db.ganttTask.findMany({
          where: {
            projectId,
            OR: [
              { requiredSubmittals: { not: null } },
              { requiredInspections: { not: null } },
            ],
          },
          select: {
            id: true,
            requiredSubmittals: true,
            requiredInspections: true,
          },
        }),
      ]);

      if (tasksWithReqs.length === 0) {
        return { totalRequired: 0, totalUploaded: 0, latestEndDate: latestEndDate._max.endDate ?? null };
      }

      // Sum all required counts
      let totalRequired = 0;
      for (const t of tasksWithReqs) {
        totalRequired += t.requiredSubmittals ?? 0;
        totalRequired += t.requiredInspections ?? 0;
      }

      // Count documents in submittal/inspection folders for these tasks
      const taskIds = tasksWithReqs.map((t) => t.id);
      const docCounts = await ctx.db.document.groupBy({
        by: ["taskId", "folderId"],
        where: {
          projectId,
          taskId: { in: taskIds },
          folderId: {
            startsWith: "submittals",
          },
        },
        _count: { id: true },
      });

      const inspectionDocs = await ctx.db.document.groupBy({
        by: ["taskId", "folderId"],
        where: {
          projectId,
          taskId: { in: taskIds },
          folderId: {
            startsWith: "inspections",
          },
        },
        _count: { id: true },
      });

      // Sum uploaded per task, capped by their requirement
      let totalUploaded = 0;
      for (const t of tasksWithReqs) {
        if (t.requiredSubmittals != null) {
          const uploaded = docCounts
            .filter((d) => d.taskId === t.id)
            .reduce((sum, d) => sum + d._count.id, 0);
          totalUploaded += Math.min(uploaded, t.requiredSubmittals);
        }
        if (t.requiredInspections != null) {
          const uploaded = inspectionDocs
            .filter((d) => d.taskId === t.id)
            .reduce((sum, d) => sum + d._count.id, 0);
          totalUploaded += Math.min(uploaded, t.requiredInspections);
        }
      }

      return { totalRequired, totalUploaded, latestEndDate: latestEndDate._max.endDate ?? null };
    }),
});
