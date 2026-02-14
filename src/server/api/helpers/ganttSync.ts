import type { Prisma } from "../../../../generated/prisma";
import type { TaskRecord, DependencyRecord, ResourceRecord, AssignmentRecord, TimeRangeRecord } from "~/lib/validations/gantt";
import { createId } from '@paralleldrive/cuid2';

type PhantomIdMap = Map<string, string>;
type TransactionClient = Omit<Prisma.TransactionClient, never>;

/**
 * Process task changes (added, updated, removed)
 */
export async function syncTasks(
  db: TransactionClient,
  projectId: string,
  changes: { added?: TaskRecord[]; updated?: TaskRecord[]; removed?: { id: string }[] } | undefined,
  phantomIdMap: PhantomIdMap,
) {
  const result: { rows: Array<{ $PhantomId?: string; id: string }> } = { rows: [] };

  if (!changes) return result;

  // Process removals
  if (changes.removed) {
    await db.ganttTask.deleteMany({
      where: {
        id: { in: changes.removed.map((r) => r.id) },
        projectId,
      },
    });
  }

  // Process additions
  if (changes.added) {
    for (const task of changes.added) {
      const id = createId();

      // Resolve parent phantom ID if needed
      let parentId = task.parentId;
      if (parentId && parentId.startsWith("$")) {
        parentId = phantomIdMap.get(parentId) ?? null;
      }

      await db.ganttTask.create({
        data: {
          id,
          projectId,
          parentId,
          name: task.name ?? "New Task",
          percentDone: task.percentDone ?? 0,
          startDate: task.startDate ? new Date(task.startDate) : null,
          endDate: task.endDate ? new Date(task.endDate) : null,
          duration: task.duration ?? null,
          durationUnit: task.durationUnit ?? "day",
          effort: task.effort ?? null,
          effortUnit: task.effortUnit ?? null,
          expanded: task.expanded ?? false,
          orderIndex: task.orderIndex ?? 0,
          manuallyScheduled: task.manuallyScheduled ?? false,
          constraintType: task.constraintType ?? null,
          constraintDate: task.constraintDate ? new Date(task.constraintDate) : null,
          rollup: task.rollup ?? false,
          cls: task.cls ?? null,
          iconCls: task.iconCls ?? null,
          note: task.note ?? null,
          baselines: task.baselines ?? null,
        },
      });

      if (task.$PhantomId) {
        phantomIdMap.set(task.$PhantomId, id);
        result.rows.push({ $PhantomId: task.$PhantomId, id });
      }
    }
  }

  // Process updates
  if (changes.updated) {
    for (const task of changes.updated) {
      if (!task.id) continue;

      const updateData: Record<string, unknown> = {};

      if (task.name !== undefined) updateData.name = task.name;
      if (task.percentDone !== undefined) updateData.percentDone = task.percentDone;
      if (task.startDate !== undefined) updateData.startDate = task.startDate ? new Date(task.startDate) : null;
      if (task.endDate !== undefined) updateData.endDate = task.endDate ? new Date(task.endDate) : null;
      if (task.duration !== undefined) updateData.duration = task.duration;
      if (task.durationUnit !== undefined) updateData.durationUnit = task.durationUnit;
      if (task.effort !== undefined) updateData.effort = task.effort;
      if (task.effortUnit !== undefined) updateData.effortUnit = task.effortUnit;
      if (task.expanded !== undefined) updateData.expanded = task.expanded;
      if (task.orderIndex !== undefined) updateData.orderIndex = task.orderIndex;
      if (task.manuallyScheduled !== undefined) updateData.manuallyScheduled = task.manuallyScheduled;
      if (task.constraintType !== undefined) updateData.constraintType = task.constraintType;
      if (task.constraintDate !== undefined) updateData.constraintDate = task.constraintDate ? new Date(task.constraintDate) : null;
      if (task.rollup !== undefined) updateData.rollup = task.rollup;
      if (task.cls !== undefined) updateData.cls = task.cls;
      if (task.iconCls !== undefined) updateData.iconCls = task.iconCls;
      if (task.note !== undefined) updateData.note = task.note;
      if (task.baselines !== undefined) updateData.baselines = task.baselines;

      // Resolve parent phantom ID if needed
      if (task.parentId !== undefined) {
        let parentId = task.parentId;
        if (parentId && parentId.startsWith("$")) {
          parentId = phantomIdMap.get(parentId) ?? null;
        }
        updateData.parentId = parentId;
      }

      await db.ganttTask.update({
        where: { id: task.id, projectId },
        data: updateData,
      });
    }
  }

  return result;
}

/**
 * Process dependency changes
 */
export async function syncDependencies(
  db: TransactionClient,
  projectId: string,
  changes: { added?: DependencyRecord[]; updated?: DependencyRecord[]; removed?: { id: string }[] } | undefined,
  phantomIdMap: PhantomIdMap,
) {
  const result: { rows: Array<{ $PhantomId?: string; id: string }> } = { rows: [] };

  if (!changes) return result;

  // Process removals
  if (changes.removed) {
    await db.ganttDependency.deleteMany({
      where: {
        id: { in: changes.removed.map((r) => r.id) },
        projectId,
      },
    });
  }

  // Process additions
  if (changes.added) {
    for (const dep of changes.added) {
      const id = createId();

      // Resolve task IDs (might be phantom IDs from just-created tasks)
      const fromTaskId = dep.fromTask ?? dep.from ?? dep.fromTaskId;
      const toTaskId = dep.toTask ?? dep.to ?? dep.toTaskId;

      if (!fromTaskId || !toTaskId) continue;

      const resolvedFromTaskId = fromTaskId.startsWith("$") ? phantomIdMap.get(fromTaskId) : fromTaskId;
      const resolvedToTaskId = toTaskId.startsWith("$") ? phantomIdMap.get(toTaskId) : toTaskId;

      if (!resolvedFromTaskId || !resolvedToTaskId) continue;

      await db.ganttDependency.create({
        data: {
          id,
          projectId,
          fromTaskId: resolvedFromTaskId,
          toTaskId: resolvedToTaskId,
          type: dep.type ?? 2,
          lag: dep.lag ?? 0,
          lagUnit: dep.lagUnit ?? null,
          cls: dep.cls ?? null,
        },
      });

      if (dep.$PhantomId) {
        phantomIdMap.set(dep.$PhantomId, id);
        result.rows.push({ $PhantomId: dep.$PhantomId, id });
      }
    }
  }

  // Process updates
  if (changes.updated) {
    for (const dep of changes.updated) {
      if (!dep.id) continue;

      const updateData: Record<string, unknown> = {};
      if (dep.type !== undefined) updateData.type = dep.type;
      if (dep.lag !== undefined) updateData.lag = dep.lag;
      if (dep.lagUnit !== undefined) updateData.lagUnit = dep.lagUnit;
      if (dep.cls !== undefined) updateData.cls = dep.cls;

      await db.ganttDependency.update({
        where: { id: dep.id, projectId },
        data: updateData,
      });
    }
  }

  return result;
}

/**
 * Process resource changes
 */
export async function syncResources(
  db: TransactionClient,
  projectId: string,
  changes: { added?: ResourceRecord[]; updated?: ResourceRecord[]; removed?: { id: string }[] } | undefined,
  phantomIdMap: PhantomIdMap,
) {
  const result: { rows: Array<{ $PhantomId?: string; id: string }> } = { rows: [] };

  if (!changes) return result;

  // Process removals
  if (changes.removed) {
    await db.ganttResource.deleteMany({
      where: {
        id: { in: changes.removed.map((r) => r.id) },
        projectId,
      },
    });
  }

  // Process additions
  if (changes.added) {
    for (const resource of changes.added) {
      const id = createId();

      await db.ganttResource.create({
        data: {
          id,
          projectId,
          name: resource.name ?? "New Resource",
          city: resource.city ?? null,
          calendar: resource.calendar ?? null,
          image: resource.image ?? null,
        },
      });

      if (resource.$PhantomId) {
        phantomIdMap.set(resource.$PhantomId, id);
        result.rows.push({ $PhantomId: resource.$PhantomId, id });
      }
    }
  }

  // Process updates
  if (changes.updated) {
    for (const resource of changes.updated) {
      if (!resource.id) continue;

      const updateData: Record<string, unknown> = {};
      if (resource.name !== undefined) updateData.name = resource.name;
      if (resource.city !== undefined) updateData.city = resource.city;
      if (resource.calendar !== undefined) updateData.calendar = resource.calendar;
      if (resource.image !== undefined) updateData.image = resource.image;

      await db.ganttResource.update({
        where: { id: resource.id, projectId },
        data: updateData,
      });
    }
  }

  return result;
}

/**
 * Process assignment changes
 */
export async function syncAssignments(
  db: TransactionClient,
  projectId: string,
  changes: { added?: AssignmentRecord[]; updated?: AssignmentRecord[]; removed?: { id: string }[] } | undefined,
  phantomIdMap: PhantomIdMap,
) {
  const result: { rows: Array<{ $PhantomId?: string; id: string }> } = { rows: [] };

  if (!changes) return result;

  // Process removals
  if (changes.removed) {
    await db.ganttAssignment.deleteMany({
      where: {
        id: { in: changes.removed.map((r) => r.id) },
        projectId,
      },
    });
  }

  // Process additions
  if (changes.added) {
    for (const assignment of changes.added) {
      const id = createId();

      const taskId = assignment.event ?? assignment.taskId;
      const resourceId = assignment.resource ?? assignment.resourceId;

      if (!taskId || !resourceId) continue;

      const resolvedTaskId = taskId.startsWith("$") ? phantomIdMap.get(taskId) : taskId;
      const resolvedResourceId = resourceId.startsWith("$") ? phantomIdMap.get(resourceId) : resourceId;

      if (!resolvedTaskId || !resolvedResourceId) continue;

      await db.ganttAssignment.create({
        data: {
          id,
          projectId,
          taskId: resolvedTaskId,
          resourceId: resolvedResourceId,
          units: assignment.units ?? 100,
        },
      });

      if (assignment.$PhantomId) {
        phantomIdMap.set(assignment.$PhantomId, id);
        result.rows.push({ $PhantomId: assignment.$PhantomId, id });
      }
    }
  }

  // Process updates
  if (changes.updated) {
    for (const assignment of changes.updated) {
      if (!assignment.id) continue;

      const updateData: Record<string, unknown> = {};
      if (assignment.units !== undefined) updateData.units = assignment.units;

      await db.ganttAssignment.update({
        where: { id: assignment.id, projectId },
        data: updateData,
      });
    }
  }

  return result;
}

/**
 * Process time range changes
 */
export async function syncTimeRanges(
  db: TransactionClient,
  projectId: string,
  changes: { added?: TimeRangeRecord[]; updated?: TimeRangeRecord[]; removed?: { id: string }[] } | undefined,
  phantomIdMap: PhantomIdMap,
) {
  const result: { rows: Array<{ $PhantomId?: string; id: string }> } = { rows: [] };

  if (!changes) return result;

  // Process removals
  if (changes.removed) {
    await db.ganttTimeRange.deleteMany({
      where: {
        id: { in: changes.removed.map((r) => r.id) },
        projectId,
      },
    });
  }

  // Process additions
  if (changes.added) {
    for (const timeRange of changes.added) {
      const id = createId();

      await db.ganttTimeRange.create({
        data: {
          id,
          projectId,
          name: timeRange.name ?? "New Time Range",
          startDate: timeRange.startDate ? new Date(timeRange.startDate) : new Date(),
          duration: timeRange.duration ?? null,
          durationUnit: timeRange.durationUnit ?? null,
          cls: timeRange.cls ?? null,
        },
      });

      if (timeRange.$PhantomId) {
        phantomIdMap.set(timeRange.$PhantomId, id);
        result.rows.push({ $PhantomId: timeRange.$PhantomId, id });
      }
    }
  }

  // Process updates
  if (changes.updated) {
    for (const timeRange of changes.updated) {
      if (!timeRange.id) continue;

      const updateData: Record<string, unknown> = {};
      if (timeRange.name !== undefined) updateData.name = timeRange.name;
      if (timeRange.startDate !== undefined) updateData.startDate = new Date(timeRange.startDate);
      if (timeRange.duration !== undefined) updateData.duration = timeRange.duration;
      if (timeRange.durationUnit !== undefined) updateData.durationUnit = timeRange.durationUnit;
      if (timeRange.cls !== undefined) updateData.cls = timeRange.cls;

      await db.ganttTimeRange.update({
        where: { id: timeRange.id, projectId },
        data: updateData,
      });
    }
  }

  return result;
}
