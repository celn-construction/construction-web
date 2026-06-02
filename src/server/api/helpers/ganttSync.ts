import { Prisma } from "../../../../generated/prisma";
import type { TaskRecord, DependencyRecord, ResourceRecord, AssignmentRecord, TimeRangeRecord } from "@/lib/validations/gantt";
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

    // Bryntum doesn't track our custom `orderIndex` field, so freshly added
    // tasks arrive without one. Append each new task after the current max
    // orderIndex *within its own sibling group* (same parentId) — NOT the
    // project-wide max. Scoping per-parent keeps orderIndex in the same 0-based
    // space as Bryntum's per-level position (`parentIndex`), so a later
    // drag-reorder — which only re-syncs the siblings that actually moved —
    // never leaves an un-moved sibling stranded with a larger, project-scale
    // index that would re-sort it ahead of the moved rows on reload.
    const maxByParent = await db.ganttTask.groupBy({
      by: ["parentId"],
      where: { projectId },
      _max: { orderIndex: true },
    });
    // `null` parentId (root-level tasks) is a valid, distinct Map key.
    const nextOrderByParent = new Map<string | null, number>();
    for (const row of maxByParent) {
      nextOrderByParent.set(row.parentId, (row._max.orderIndex ?? -1) + 1);
    }
    const nextOrderIndexFor = (parent: string | null): number => {
      const next = nextOrderByParent.get(parent) ?? 0;
      nextOrderByParent.set(parent, next + 1);
      return next;
    };

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

      // [Gantt:order DEBUG] The orderIndex assigned to each newly added task.
      // For a ">4 tasks" bug this shows whether the 5th/6th task gets a sane,
      // appended index within its sibling group (expected: dense, increasing).
      const assignedOrderIndex = task.orderIndex ?? nextOrderIndexFor(parentId);
      console.log('[Gantt:order] sync ADD', {
        id,
        name: task.name,
        parentId,
        assignedOrderIndex,
        clientSentOrderIndex: task.orderIndex,
      });

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
          orderIndex: assignedOrderIndex,
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
      } else {
        // No $PhantomId means Bryntum's afterSyncAttempt can't pair this row
        // back to the phantom record on the client — the record stays phantom
        // and gets resent on the next sync (duplicate-task / "task won't save"
        // symptom). The row was still written to the DB, so this is silent
        // data corruption. Warn loudly so the contract violation is visible
        // in the server terminal next time a client path regresses.
        console.warn('[Gantt:syncTasks] Added task without $PhantomId — Bryntum cannot materialize this on the client:', {
          dbId: id,
          name: task.name,
          hint: 'Check reconcileSyncPack and the outgoing pack — every added record must carry $PhantomId',
        });
      }
    }
  }

  // Process updates
  if (changes.updated) {
    // A drag-reorder arrives as UPDATEs carrying each moved row's new tree
    // position. Bryntum only re-sends the rows that actually moved, so we can't
    // trust per-row writes alone — a sibling that kept its slot is never sent
    // and would keep a stale orderIndex. Collect the target positions here and
    // renumber every affected sibling group densely after the loop.
    const reorderTargets = new Map<string, number>();

    for (const task of changes.updated) {
      if (!task.id) continue;

      // [Gantt:order DEBUG] Every incoming UPDATE. The key question: does a
      // routine edit (date/name/percent) arrive carrying orderedParentIndex or
      // parentIndex? If so it will be treated as a reorder below and trigger a
      // group renumber even though the user never dragged a row.
      console.log('[Gantt:order] sync UPDATE recv', {
        id: task.id,
        name: task.name,
        orderIndex: task.orderIndex,
        orderedParentIndex: task.orderedParentIndex,
        parentIndex: task.parentIndex,
        parentId: task.parentId,
      });

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
      // Bryntum's recalculated tree position for a moved row. orderedParentIndex
      // respects display order; parentIndex is the structural fallback (equal
      // when no sorter is active). Write it as the row's tentative target — the
      // post-loop renumber turns the whole group into a clean 0..N-1 sequence.
      const reorderIndex = task.orderedParentIndex ?? task.parentIndex;
      if (reorderIndex !== undefined) updateData.orderIndex = reorderIndex;
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

      try {
        await db.ganttTask.update({
          where: { id: task.id, projectId },
          data: updateData,
          select: { id: true },
        });

        // Record the reorder target only after the row is confirmed to exist,
        // so a concurrently-deleted row doesn't pull a phantom into the renumber.
        if (reorderIndex !== undefined) reorderTargets.set(task.id, reorderIndex);

        // Bryntum's CrudManager protocol: `tasks.rows` is strictly the
        // phantom→real id swap table for ADDED records. Pushing updated rows
        // (which carry no $PhantomId) into the same array poisons
        // afterSyncAttempt — it iterates every row assuming a $PhantomId and
        // throws "Cannot set properties of undefined (setting
        // 'isBeingMaterialized')" on the first one without one. Updates don't
        // need echoing: the client already knows the id from the request.
      } catch (error) {
        // P2025 = record not found (deleted concurrently or never existed —
        // e.g. STM undo of an unsynced add sends an UPDATE for a phantom id).
        // Skip silently; the next gantt.load resyncs the client.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          console.warn('[Gantt:syncTasks] Skipping update for missing task:', task.id);
          continue;
        }
        throw error;
      }
    }

    // [Gantt:order DEBUG] What the batch concluded is a reorder. If this map is
    // non-empty for a sync the user didn't reorder, the renumber that follows is
    // the source of the reshuffle.
    console.log('[Gantt:order] sync UPDATE batch done', {
      updatedCount: changes.updated.length,
      reorderTargets: Object.fromEntries(reorderTargets),
      willRenumber: reorderTargets.size > 0,
    });

    // The per-row writes above only cover the rows Bryntum re-sent; un-moved
    // siblings keep whatever orderIndex they had (e.g. legacy rows still at 0,
    // or values from a coarser scale). Rebuild each touched group as a dense
    // 0..N-1 sequence so the persisted order always matches what the user
    // dropped, regardless of the rows' prior orderIndex values.
    await renumberReorderedGroups(db, projectId, reorderTargets);
  }

  return result;
}

/**
 * Renumber the sibling groups touched by a drag-reorder so every task in an
 * affected group ends up with a dense, gap-free, 0-based orderIndex matching
 * its on-screen position.
 *
 * Why this is needed: Bryntum only re-sends the rows whose position actually
 * changed, so a row that keeps its slot is never synced and would otherwise
 * hold whatever orderIndex it had before. For legacy rows (all 0) or rows from
 * a coarser index scale, that stale value can sort it ahead of the moved rows
 * on reload. We rebuild each group's true new order from (a) the moved rows'
 * target positions and (b) the un-moved rows in their current relative order,
 * then persist a clean 0..N-1 sequence.
 */
async function renumberReorderedGroups(
  db: TransactionClient,
  projectId: string,
  reorderTargets: Map<string, number>,
) {
  if (reorderTargets.size === 0) return;

  // parentId changes were already applied above, so these are the FINAL parents.
  // A cross-parent move shifts siblings in both the source and target groups,
  // and Bryntum sends every shifted row, so the moved rows' parents cover every
  // group that needs renumbering.
  const movedRows = await db.ganttTask.findMany({
    where: { projectId, id: { in: [...reorderTargets.keys()] } },
    select: { id: true, parentId: true },
  });
  const affectedParents = new Set<string | null>(movedRows.map((r) => r.parentId));

  // [Gantt:order DEBUG]
  console.log('[Gantt:order] renumber START', {
    targets: Object.fromEntries(reorderTargets),
    affectedParents: [...affectedParents],
  });

  for (const parentId of affectedParents) {
    // Current children in their pre-reorder display order; id breaks ties
    // deterministically. Un-moved rows keep their relative order here.
    const children = await db.ganttTask.findMany({
      where: { projectId, parentId },
      select: { id: true, name: true, orderIndex: true },
      orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
    });
    const n = children.length;
    if (n === 0) continue;

    // [Gantt:order DEBUG] The group as it stands before renumbering, plus which
    // of these rows Bryntum reported a target for.
    console.log('[Gantt:order] renumber group: children-before', {
      parentId,
      children: children.map((c) => ({
        id: c.id,
        name: c.name,
        orderIndex: c.orderIndex,
        target: reorderTargets.get(c.id),
      })),
    });

    // Place each moved row at the slot Bryntum reported; fill the remaining
    // slots, in order, with the rows that didn't move. A target that is
    // out-of-range or already taken (Bryntum sends a clean set, so defensive
    // only) falls through to the leftover fill rather than corrupting the run.
    const slots: (string | null)[] = new Array<string | null>(n).fill(null);
    for (const child of children) {
      const target = reorderTargets.get(child.id);
      if (target !== undefined && target >= 0 && target < n && slots[target] === null) {
        slots[target] = child.id;
      }
    }
    const placed = new Set(slots.filter((id): id is string => id !== null));
    const leftovers = children.filter((c) => !placed.has(c.id)).map((c) => c.id);
    let nextLeftover = 0;
    for (let i = 0; i < n; i++) {
      if (slots[i] === null) slots[i] = leftovers[nextLeftover++] ?? null;
    }

    // [Gantt:order DEBUG] The reconstructed final order for this group
    // (slot index = new orderIndex). Compare against children-before: rows that
    // weren't in `targets` but moved position here are being shuffled by the
    // renumber, not by the user.
    console.log('[Gantt:order] renumber group: final order', {
      parentId,
      finalOrder: slots,
      leftovers,
    });

    // Persist the dense sequence, writing only the rows whose index changed.
    const currentOrderById = new Map(children.map((c) => [c.id, c.orderIndex]));
    for (let i = 0; i < n; i++) {
      const id = slots[i];
      if (id && currentOrderById.get(id) !== i) {
        // [Gantt:order DEBUG] Each orderIndex the renumber actually rewrites.
        console.log('[Gantt:order] renumber WRITE', {
          id,
          from: currentOrderById.get(id),
          to: i,
        });
        await db.ganttTask.update({
          where: { id, projectId },
          data: { orderIndex: i },
          select: { id: true },
        });
      }
    }
  }
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
