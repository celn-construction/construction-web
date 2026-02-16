import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "~/server/api/trpc";
import { ganttLoadInputSchema, ganttSyncInputSchema } from "~/lib/validations/gantt";
import { buildTaskTree, mapDependencyToGantt, mapResourceToGantt, mapAssignmentToGantt, mapTimeRangeToGantt } from "~/server/api/helpers/ganttTree";
import { syncTasks, syncDependencies, syncResources, syncAssignments, syncTimeRanges } from "~/server/api/helpers/ganttSync";

export const ganttRouter = createTRPCRouter({
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
        throw new Error("Project not found or access denied");
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
            baselines: true,
            orderIndex: true,
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

      return {
        success: true,
        project: {
          calendar: project.calendarId,
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          hoursPerDay: project.hoursPerDay,
          daysPerWeek: project.daysPerWeek,
          daysPerMonth: project.daysPerMonth,
        },
        calendars: project.calendars ?? null,
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
        throw new Error("Project not found or access denied");
      }

      // Use transaction for atomicity
      const result = await ctx.db.$transaction(async (tx) => {
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
      });

      return result;
    }),
});
