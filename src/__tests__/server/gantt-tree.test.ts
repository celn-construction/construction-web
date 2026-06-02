// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildTaskTree } from "@/server/api/helpers/ganttTree";

// Minimal valid GanttTaskSelect factory — only the fields the sort/tree care
// about are meaningful; the rest are filled with inert defaults.
function task(id: string, orderIndex: number, parentId: string | null = null) {
  return {
    id,
    parentId,
    name: id,
    percentDone: 0,
    startDate: null,
    endDate: null,
    duration: null,
    durationUnit: "day",
    effort: null,
    effortUnit: null,
    expanded: false,
    manuallyScheduled: false,
    constraintType: null,
    constraintDate: null,
    rollup: false,
    cls: null,
    iconCls: null,
    note: null,
    csiCode: null,
    baselines: null,
    orderIndex,
    requiredSubmittals: null,
    requiredInspections: null,
  };
}

const names = (rows: Record<string, unknown>[]) => rows.map((r) => r.id as string);

describe("buildTaskTree — ordering", () => {
  // Regression: buildTaskTree sorts by orderIndex. mapTaskToGantt must carry
  // orderIndex onto the mapped object, otherwise the comparator ties every row
  // at 0 and falls back to its id tiebreak — sorting the whole tree by id and
  // silently ignoring the persisted order (reorders revert on refresh).
  it("sorts by orderIndex even when it disagrees with id order", () => {
    // orderIndex order is z(0), a(1), m(2); a pure-id sort would give a, m, z.
    // They must differ so the regression (sorting purely by id) fails here.
    const tree = buildTaskTree([task("z", 0), task("a", 1), task("m", 2)]);
    expect(names(tree)).toEqual(["z", "a", "m"]);
  });

  it("falls back to id order only when orderIndex ties", () => {
    // All tied at 0 → deterministic id order (this is the original
    // reshuffle-stability guarantee).
    const tree = buildTaskTree([task("m", 0), task("a", 0), task("z", 0)]);
    expect(names(tree)).toEqual(["a", "m", "z"]);
  });

  it("sorts children within a parent by orderIndex", () => {
    const tree = buildTaskTree([
      task("parent", 0),
      task("childB", 0, "parent"),
      task("childA", 1, "parent"),
    ]);
    expect(names(tree)).toEqual(["parent"]);
    const children = tree[0]!.children as Record<string, unknown>[];
    // childB has orderIndex 0, childA has 1 → B before A despite id order.
    expect(names(children)).toEqual(["childB", "childA"]);
  });
});
