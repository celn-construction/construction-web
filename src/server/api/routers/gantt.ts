import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, orgProcedure, projectProcedure } from "@/server/api/trpc";
import { canManageProjects, canApproveDocuments } from "@/lib/permissions";
import {
  ganttLoadInputSchema,
  ganttSyncInputSchema,
  updateRequirementSchema,
  listSlotsSchema,
  setSlotCountSchema,
  updateSlotSchema,
  type SlotKind,
} from "@/lib/validations/gantt";
import { nextSuggestedSlotName } from "@/lib/constants/slotNameLibrary";
import { CSI_SUBDIVISION_MAP, CSI_DIVISION_MAP } from "@/lib/constants/csiCodes";
import { APPROVABLE_FOLDER_ID_LIST } from "@/lib/folders";
import { buildTaskTree, mapDependencyToGantt, mapResourceToGantt, mapAssignmentToGantt, mapTimeRangeToGantt } from "@/server/api/helpers/ganttTree";
import { syncTasks, syncDependencies, syncResources, syncAssignments, syncTimeRanges, VersionConflictError } from "@/server/api/helpers/ganttSync";
import { recordRevision } from "@/server/api/helpers/ganttRevision";
import type { RevisionChanges } from "@/server/api/helpers/ganttRevision";

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
          coverDocumentId: true,
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
        coverDocumentId: task.coverDocumentId,
        csiCode: task.csiCode,
        requiredSubmittals: task.requiredSubmittals,
        requiredInspections: task.requiredInspections,
        group: task.parent?.name ?? null,
      };
    }),

  /**
   * Pin (or unpin) a photo as the task's cover.
   * Pass documentId: null to clear the pin.
   */
  pinPhoto: projectProcedure
    .input(
      z.object({
        taskId: z.string(),
        documentId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!canManageProjects(ctx.projectMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to change the task cover",
        });
      }

      const projectId = ctx.project.id;
      const { taskId, documentId } = input;

      const task = await ctx.db.ganttTask.findFirst({
        where: { id: taskId, projectId },
        select: { id: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      if (documentId) {
        const document = await ctx.db.document.findFirst({
          where: { id: documentId, projectId, taskId, folderId: "photos" },
          select: { id: true, mimeType: true },
        });
        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Photo not found in this task's Photos folder",
          });
        }
        if (!document.mimeType.startsWith("image/")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only image files can be pinned as a cover",
          });
        }
      }

      await ctx.db.ganttTask.update({
        where: { id: taskId },
        data: { coverDocumentId: documentId },
      });

      return { success: true };
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
      const [tasks, dependencies, resources, assignments, timeRanges, needsReviewRows] = await Promise.all([
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
        ctx.db.document.groupBy({
          by: ["taskId"],
          where: {
            projectId,
            approvalStatus: "unapproved",
            folderId: { in: APPROVABLE_FOLDER_ID_LIST },
          },
          _count: { _all: true },
        }),
      ]);

      // Build needsReviewCount map per task (rolled up to parents in buildTaskTree)
      const needsReviewCounts = new Map<string, number>();
      for (const row of needsReviewRows) {
        if (row.taskId) {
          needsReviewCounts.set(row.taskId, row._count._all);
        }
      }

      // Build hierarchical task tree
      const taskTree = buildTaskTree(tasks, needsReviewCounts);

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

  // ─── Per-slot tracking (Tier 2/3) ──────────────────────────────────────
  // Slots carry the metadata that the legacy requiredSubmittals/Inspections
  // integers don't: name, due date, approver. They are kept in sync with those
  // count columns by setSlotCount so the popover and existing readers keep
  // working. listSlots auto-backfills from the legacy count on first read.

  listSlots: orgProcedure
    .input(z.object({ projectId: z.string() }).merge(listSlotsSchema))
    .query(async ({ ctx, input }) => {
      const { projectId, taskId, kind } = input;

      const task = await ctx.db.ganttTask.findFirst({
        where: { id: taskId, projectId, project: { organizationId: ctx.organization.id } },
        select: { id: true, requiredSubmittals: true, requiredInspections: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const existing = await ctx.db.taskRequirementSlot.findMany({
        where: { taskId, kind },
        orderBy: { index: "asc" },
        include: {
          approver: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      const legacyCount = legacyCountForKind(task, kind);

      // Lazy backfill: legacy count > 0 but no slot rows yet → create N anonymous slots.
      if (existing.length === 0 && legacyCount > 0) {
        await ctx.db.taskRequirementSlot.createMany({
          data: Array.from({ length: legacyCount }, (_, i) => ({
            taskId,
            kind,
            index: i,
          })),
          skipDuplicates: true,
        });
        return ctx.db.taskRequirementSlot.findMany({
          where: { taskId, kind },
          orderBy: { index: "asc" },
          include: {
            approver: { select: { id: true, name: true, email: true, image: true } },
          },
        });
      }

      return existing;
    }),

  setSlotCount: orgProcedure
    .input(z.object({ projectId: z.string() }).merge(setSlotCountSchema))
    .mutation(async ({ ctx, input }) => {
      if (!canApproveDocuments(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage requirements",
        });
      }

      const { projectId, taskId, kind, count } = input;

      const task = await ctx.db.ganttTask.findFirst({
        where: { id: taskId, projectId, project: { organizationId: ctx.organization.id } },
        select: { id: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const legacyField = kind === "submittal" ? "requiredSubmittals" : "requiredInspections";

      return ctx.db.$transaction(async (tx) => {
        const current = await tx.taskRequirementSlot.findMany({
          where: { taskId, kind },
          orderBy: { index: "asc" },
          select: { id: true, index: true, name: true },
        });

        if (count > current.length) {
          // Add slots at the end with smart-default names from the library,
          // skipping any names already taken by existing slots.
          const names: (string | null)[] = current.map((s) => s.name);
          const newSlots: Array<{ taskId: string; kind: string; index: number; name: string | null }> = [];
          for (let i = 0; i < count - current.length; i++) {
            const name = nextSuggestedSlotName(kind, names);
            names.push(name);
            newSlots.push({
              taskId,
              kind,
              index: current.length + i,
              name,
            });
          }
          await tx.taskRequirementSlot.createMany({ data: newSlots });
        } else if (count < current.length) {
          // Remove the last (current.length - count) slots
          const toRemove = current.slice(count).map((s) => s.id);
          await tx.taskRequirementSlot.deleteMany({ where: { id: { in: toRemove } } });
        }

        // Keep the legacy count column in sync so existing readers (popover header,
        // requirementStats, TrackableFolderContent) don't need to change.
        await tx.ganttTask.update({
          where: { id: taskId },
          data: { [legacyField]: count === 0 ? null : count },
        });

        return tx.taskRequirementSlot.findMany({
          where: { taskId, kind },
          orderBy: { index: "asc" },
          include: {
            approver: { select: { id: true, name: true, email: true, image: true } },
          },
        });
      });
    }),

  updateSlot: orgProcedure
    .input(z.object({ projectId: z.string() }).merge(updateSlotSchema))
    .mutation(async ({ ctx, input }) => {
      if (!canApproveDocuments(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage requirements",
        });
      }

      const { projectId, slotId, ...patch } = input;

      const slot = await ctx.db.taskRequirementSlot.findUnique({
        where: { id: slotId },
        select: { id: true, task: { select: { projectId: true, project: { select: { organizationId: true } } } } },
      });
      if (
        !slot ||
        slot.task.projectId !== projectId ||
        slot.task.project.organizationId !== ctx.organization.id
      ) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }

      // If approverId is provided, verify the user is a member of this org.
      if (patch.approverId) {
        const member = await ctx.db.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: patch.approverId,
              organizationId: ctx.organization.id,
            },
          },
          select: { id: true },
        });
        if (!member) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Approver must be a member of this organization",
          });
        }
      }

      const data: Record<string, unknown> = {};
      if (patch.name !== undefined) {
        data.name = patch.name === null ? null : patch.name.trim() || null;
      }
      if (patch.dueDate !== undefined) {
        data.dueDate = patch.dueDate === null ? null : new Date(patch.dueDate);
      }
      if (patch.approverId !== undefined) data.approverId = patch.approverId;

      return ctx.db.taskRequirementSlot.update({
        where: { id: slotId },
        data,
        include: {
          approver: { select: { id: true, name: true, email: true, image: true } },
        },
      });
    }),
});

function legacyCountForKind(
  task: { requiredSubmittals: number | null; requiredInspections: number | null },
  kind: SlotKind,
): number {
  if (kind === "submittal") return task.requiredSubmittals ?? 0;
  return task.requiredInspections ?? 0;
}
