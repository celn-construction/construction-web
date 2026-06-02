import type { GanttTask, GanttDependency, GanttResource, GanttAssignment, GanttTimeRange } from "../../../../generated/prisma";

// Type for the subset of GanttTask fields selected by the load query
type GanttTaskSelect = {
  id: string;
  parentId: string | null;
  name: string;
  percentDone: number;
  startDate: Date | null;
  endDate: Date | null;
  duration: number | null;
  durationUnit: string | null;
  effort: number | null;
  effortUnit: string | null;
  expanded: boolean;
  manuallyScheduled: boolean;
  constraintType: string | null;
  constraintDate: Date | null;
  rollup: boolean;
  cls: string | null;
  iconCls: string | null;
  note: string | null;
  csiCode: string | null;
  baselines: unknown;
  orderIndex: number;
  requiredSubmittals?: number | null;
  requiredInspections?: number | null;
};

// Bryntum expects specific field names - map DB fields to Bryntum fields
export function mapTaskToGantt(
  task: GanttTaskSelect,
  needsReviewCount = 0,
  requirementsFilled = 0,
): Record<string, unknown> {
  const requirementsTotal =
    (task.requiredSubmittals ?? 0) + (task.requiredInspections ?? 0);
  return {
    id: task.id,
    parentId: task.parentId,
    name: task.name,
    percentDone: task.percentDone,
    startDate: task.startDate?.toISOString(),
    endDate: task.endDate?.toISOString(),
    duration: task.duration,
    durationUnit: task.durationUnit,
    effort: task.effort,
    effortUnit: task.effortUnit,
    expanded: task.expanded,
    manuallyScheduled: task.manuallyScheduled,
    constraintType: task.constraintType,
    constraintDate: task.constraintDate?.toISOString(),
    rollup: task.rollup,
    cls: task.cls,
    iconCls: task.iconCls,
    note: task.note,
    csiCode: task.csiCode,
    baselines: task.baselines,
    // buildTaskTree sorts each level by orderIndex — it must be present on the
    // mapped object or the comparator ties every row at 0 and falls back to its
    // id tiebreak, sorting the whole tree by id and ignoring the real order.
    // (Bryntum drops this field client-side since it isn't on AppTaskModel; it
    // exists purely so the server-side sort is correct. The array order it
    // produces is what Bryntum renders.)
    orderIndex: task.orderIndex,
    needsReviewCount,
    requirementsTotal,
    requirementsFilled: Math.min(requirementsFilled, requirementsTotal),
  };
}

export function mapDependencyToGantt(dep: GanttDependency): Record<string, unknown> {
  return {
    id: dep.id,
    fromTask: dep.fromTaskId, // Bryntum uses 'fromTask' instead of 'fromTaskId'
    toTask: dep.toTaskId, // Bryntum uses 'toTask' instead of 'toTaskId'
    type: dep.type,
    lag: dep.lag,
    lagUnit: dep.lagUnit,
    cls: dep.cls,
  };
}

export function mapResourceToGantt(resource: GanttResource): Record<string, unknown> {
  return {
    id: resource.id,
    name: resource.name,
    city: resource.city,
    calendar: resource.calendar,
    image: resource.image,
  };
}

export function mapAssignmentToGantt(assignment: GanttAssignment): Record<string, unknown> {
  return {
    id: assignment.id,
    event: assignment.taskId, // Bryntum uses 'event' for task reference
    resource: assignment.resourceId, // Bryntum uses 'resource' for resource reference
    units: assignment.units,
  };
}

export function mapTimeRangeToGantt(timeRange: GanttTimeRange): Record<string, unknown> {
  return {
    id: timeRange.id,
    name: timeRange.name,
    startDate: timeRange.startDate.toISOString(),
    duration: timeRange.duration,
    durationUnit: timeRange.durationUnit,
    cls: timeRange.cls,
  };
}

/**
 * Build hierarchical task tree from flat task array.
 * Tasks with parentId will be nested under their parent's children array.
 * If needsReviewCounts is provided, each task gets the count from the map and
 * parent tasks roll up the sum from their descendants.
 */
export function buildTaskTree(
  tasks: GanttTaskSelect[],
  needsReviewCounts?: Map<string, number>,
  requirementsFilledCounts?: Map<string, number>,
): Record<string, unknown>[] {
  const taskMap = new Map<string, Record<string, unknown>>();
  const rootTasks: Record<string, unknown>[] = [];

  // First pass: create all task objects
  for (const task of tasks) {
    const ganttTask = mapTaskToGantt(
      task,
      needsReviewCounts?.get(task.id) ?? 0,
      requirementsFilledCounts?.get(task.id) ?? 0,
    );
    ganttTask.children = [];
    taskMap.set(task.id, ganttTask);
  }

  // Second pass: build tree structure
  for (const task of tasks) {
    const ganttTask = taskMap.get(task.id)!;

    if (task.parentId && taskMap.has(task.parentId)) {
      // Add to parent's children
      const parent = taskMap.get(task.parentId)!;
      (parent.children as Record<string, unknown>[]).push(ganttTask);
    } else {
      // Top-level task
      rootTasks.push(ganttTask);
    }
  }

  // Sort by orderIndex at each level, tie-breaking on the stable `id`.
  // Without the tie-break, sibling tasks that share orderIndex (e.g. all 0 for
  // tasks added before they had an explicit order) would keep whatever order
  // the DB happened to return, which is non-deterministic — the "rows reshuffle
  // on refresh" bug. `id` never changes, so the order stays put across reloads.
  const sortByOrderIndex = (arr: Record<string, unknown>[]) => {
    arr.sort((a, b) => {
      const aIndex = (a.orderIndex as number) ?? 0;
      const bIndex = (b.orderIndex as number) ?? 0;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return String(a.id).localeCompare(String(b.id));
    });

    // Recursively sort children
    for (const item of arr) {
      const children = item.children as Record<string, unknown>[];
      if (children && children.length > 0) {
        sortByOrderIndex(children);
      }
    }
  };

  sortByOrderIndex(rootTasks);

  // Roll up needsReviewCount from children to parents (post-order traversal)
  if (needsReviewCounts) {
    const rollup = (node: Record<string, unknown>): number => {
      const children = (node.children as Record<string, unknown>[]) ?? [];
      let sum = (node.needsReviewCount as number) ?? 0;
      for (const child of children) {
        sum += rollup(child);
      }
      node.needsReviewCount = sum;
      return sum;
    };
    for (const root of rootTasks) {
      rollup(root);
    }
  }

  return rootTasks;
}
