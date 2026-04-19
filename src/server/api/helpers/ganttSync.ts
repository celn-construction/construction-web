import { Prisma } from "../../../../generated/prisma";
import type { TaskRecord, DependencyRecord, ResourceRecord, AssignmentRecord, TimeRangeRecord } from "@/lib/validations/gantt";
import { createId } from '@paralleldrive/cuid2';

type PhantomIdMap = Map<string, string>;
type TransactionClient = Omit<Prisma.TransactionClient, never>;

/**
 * Thrown when a task update fails optimistic version check.
 * The transaction should be rolled back and the client should reload.
 */
export class VersionConflictError extends Error {
  public conflictedTaskIds: string[];
  constructor(taskIds: string[]) {
    super(`Version conflict on tasks: ${taskIds.join(', ')}`);
    this.name = 'VersionConflictError';
    this.conflictedTaskIds = taskIds;
  }
}

/**
 * Process task changes (added, updated, removed)
 */
export async function syncTasks(
  db: TransactionClient,
  projectId: string,
  changes: { added?: TaskRecord[]; updated?: TaskRecord[]; removed?: { id: string }[] } | undefined,
  phantomIdMap: PhantomIdMap,
) {
  const result: { rows: Array<{ $PhantomId?: string; id: string; version?: number }> } = { rows: [] };

  if (!changes) return result;

  // Process removals
  if (changes.removed) {
    await db.ganttTask.deleteMany({
      where: {
        id: { in: changes.removed.filter((r): r is { id: string } => r != null && typeof r.id === 'string').map((r) => r.id) },
        projectId,
      },
    });
  }

  // Process additions
  if (changes.added) {
    // Pre-assign real IDs and build a complete phantom→real map before any DB inserts.
    // This handles the case where Bryntum sends parent+child in the same batch — the
    // child's parentId references the parent's phantom ID which may not yet be in
    // phantomIdMap, causing a FK violation if we insert naively in array order.
    const tasksWithIds = changes.added.map((task) => ({
      task,
      id: createId(),
    }));

    // Register all phantom IDs upfront so parent references resolve correctly
    for (const { task, id } of tasksWithIds) {
      if (task.$PhantomId) {
        phantomIdMap.set(task.$PhantomId, id);
      }
    }

    // Topological sort: parents must be inserted before their children.
    // Build a map from phantom ID → index in the batch.
    const phantomToIndex = new Map<string, number>();
    for (let i = 0; i < tasksWithIds.length; i++) {
      const { task } = tasksWithIds[i]!;
      if (task.$PhantomId) phantomToIndex.set(task.$PhantomId, i);
    }

    const visited = new Set<number>();
    const sorted: typeof tasksWithIds = [];

    function visit(index: number) {
      if (visited.has(index)) return;
      visited.add(index);
      const { task } = tasksWithIds[index]!;
      const parentId = task.parentId;
      if (parentId) {
        const parentIndex = phantomToIndex.get(parentId);
        if (parentIndex !== undefined) visit(parentIndex);
      }
      sorted.push(tasksWithIds[index]!);
    }

    for (let i = 0; i < tasksWithIds.length; i++) visit(i);

    // Resolve a parentId against the full phantom map (any format, not just "$"-prefixed)
    const resolveParentId = (parentId: string | null | undefined): string | null => {
      if (!parentId) return null;
      return phantomIdMap.get(parentId) ?? parentId;
    };

    // Pre-fetch all existing task IDs in this project so we can verify parent references
    // before INSERT — otherwise a stale parentId (task deleted in a prior sync, or a
    // phantom reference that never resolved) triggers FK violation and rolls back
    // the whole transaction. Better to null the parent and log than fail the batch.
    const existingTaskIds = new Set(
      (await db.ganttTask.findMany({ where: { projectId }, select: { id: true } }))
        .map((t) => t.id),
    );
    // Pre-assigned IDs in this batch also count as "existing" because they insert first.
    for (const { id } of tasksWithIds) existingTaskIds.add(id);

    for (const { task, id } of sorted) {
      let parentId = resolveParentId(task.parentId);
      if (parentId && !existingTaskIds.has(parentId)) {
        console.warn('[Gantt:syncTasks] Orphan parentId — setting to null:', {
          taskId: id,
          phantomId: task.$PhantomId,
          unresolvedParentId: task.parentId,
          resolvedAs: parentId,
        });
        parentId = null;
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
          csiCode: task.csiCode ?? null,
          baselines: task.baselines ?? null,
        },
      });

      if (task.$PhantomId) {
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
      if (task.csiCode !== undefined) updateData.csiCode = task.csiCode;
      if (task.baselines !== undefined) updateData.baselines = task.baselines;

      // Resolve parent phantom ID if needed (any phantom format, not just "$"-prefixed)
      if (task.parentId !== undefined) {
        const rawParentId = task.parentId;
        const resolved = rawParentId
          ? (phantomIdMap.get(rawParentId) ?? rawParentId)
          : null;
        if (resolved) {
          // Verify parent actually exists to avoid FK violation rolling back the batch
          const parentExists = await db.ganttTask.findUnique({
            where: { id: resolved },
            select: { id: true },
          });
          if (!parentExists) {
            console.warn('[Gantt:syncTasks] Orphan parentId on update — setting to null:', {
              taskId: task.id,
              unresolvedParentId: rawParentId,
              resolvedAs: resolved,
            });
            updateData.parentId = null;
          } else {
            updateData.parentId = resolved;
          }
        } else {
          updateData.parentId = null;
        }
      }

      // Optimistic version check: only if client sent a version (direct user edits).
      // Engine-cascaded updates (e.g. successor recalculation) won't have version
      // and skip the check — they're recalculated from the source change anyway.
      if (task.version != null) {
        const existing = await db.ganttTask.findUnique({
          where: { id: task.id },
          select: { version: true, projectId: true },
        });

        console.log('[Gantt:syncTasks] Version check:', task.id, '— client:', task.version, 'db:', existing?.version);

        if (!existing || existing.projectId !== projectId) {
          throw new VersionConflictError([task.id]);
        }

        if (existing.version !== task.version) {
          console.log('[Gantt:syncTasks] CONFLICT:', task.id, '— client:', task.version, 'db:', existing.version);
          throw new VersionConflictError([task.id]);
        }
      } else {
        console.log('[Gantt:syncTasks] No version sent for', task.id, '— engine-cascaded update, skipping check');
      }

      // Always increment version atomically on every update
      updateData.version = { increment: 1 };

      try {
        const updated = await db.ganttTask.update({
          where: { id: task.id, projectId },
          data: updateData,
          select: { id: true, version: true },
        });

        // Return new version so client stays in sync (prevents self-conflict on next save)
        console.log('[Gantt:syncTasks] Updated:', updated.id, '→ new version:', updated.version);
        result.rows.push({ id: updated.id, version: updated.version });
      } catch (error) {
        // P2025 = record not found (another user deleted this task)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new VersionConflictError([task.id]);
        }
        throw error;
      }
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
        id: { in: changes.removed.filter((r): r is { id: string } => r != null && typeof r.id === 'string').map((r) => r.id) },
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

      const resolvedFromTaskId = phantomIdMap.get(fromTaskId) ?? fromTaskId;
      const resolvedToTaskId = phantomIdMap.get(toTaskId) ?? toTaskId;

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
        id: { in: changes.removed.filter((r): r is { id: string } => r != null && typeof r.id === 'string').map((r) => r.id) },
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
        id: { in: changes.removed.filter((r): r is { id: string } => r != null && typeof r.id === 'string').map((r) => r.id) },
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

      const resolvedTaskId = phantomIdMap.get(taskId) ?? taskId;
      const resolvedResourceId = phantomIdMap.get(resourceId) ?? resourceId;

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
        id: { in: changes.removed.filter((r): r is { id: string } => r != null && typeof r.id === 'string').map((r) => r.id) },
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
