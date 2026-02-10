"use client";

import type { FC } from "react";
import { memo, useContext, useMemo } from "react";
import type { GanttDependency } from "@/types/gantt-types";
import type { GanttFeature } from "./index";
import { GanttContext, getOffset, getWidth, type FeaturePositionMap } from "./index";

type Props = {
  dependencies: GanttDependency[];
  features: Map<string, GanttFeature>;
  positionMap: FeaturePositionMap;
  groups: string[];
  subRowCounts: Record<string, number>;
};

export const GanttDependencyArrows: FC<Props> = memo(({
  dependencies,
  features,
  positionMap,
  groups,
  subRowCounts,
}) => {
  const gantt = useContext(GanttContext);
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData[0]?.year ?? new Date().getFullYear(), 0, 1),
    [gantt.timelineData]
  );

  // Calculate group top offsets (cumulative height from previous groups)
  const groupTopOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let cumulative = 0;
    groups.forEach((groupName, index) => {
      offsets[groupName] = cumulative;
      // Group header (36px) + feature rows (subRowCount * 36px) + gap (16px)
      cumulative += 36 + (subRowCounts[groupName] || 1) * 36 + 16;
    });
    return offsets;
  }, [groups, subRowCounts]);

  const arrows = useMemo(() => {
    return dependencies
      .map((dep) => {
        const fromFeature = features.get(dep.fromId);
        const toFeature = features.get(dep.toId);

        if (!fromFeature || !toFeature) return null;

        const fromPos = positionMap.get(dep.fromId);
        const toPos = positionMap.get(dep.toId);

        if (!fromPos || !toPos) return null;

        // Calculate X positions
        const fromX = getOffset(fromFeature.startAt, timelineStartDate, gantt);
        const fromWidth = getWidth(fromFeature.startAt, fromFeature.endAt, gantt);
        const toX = getOffset(toFeature.startAt, timelineStartDate, gantt);

        const x1 = fromX + fromWidth; // Right edge of predecessor
        const x2 = toX; // Left edge of successor

        // Calculate Y positions (center of feature bars)
        const fromGroup = groups[fromPos.groupIndex];
        const toGroup = groups[toPos.groupIndex];

        if (!fromGroup || !toGroup) return null;

        const fromGroupOffset = groupTopOffsets[fromGroup] || 0;
        const toGroupOffset = groupTopOffsets[toGroup] || 0;

        const y1 = fromGroupOffset + 36 + fromPos.subRow * 36 + 18; // Group header + sub-row offset + half bar height
        const y2 = toGroupOffset + 36 + toPos.subRow * 36 + 18;

        return {
          id: dep.id,
          x1,
          y1,
          x2,
          y2,
          fromFeature,
          toFeature,
        };
      })
      .filter((arrow) => arrow !== null);
  }, [dependencies, features, positionMap, groups, groupTopOffsets, timelineStartDate, gantt]);

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 10 }}
    >
      {arrows.map((arrow) => {
        if (!arrow) return null;

        const { id, x1, y1, x2, y2 } = arrow;
        const gap = 12;
        const arrowSize = 6;

        // Determine path type based on horizontal spacing
        let path: string;
        if (x2 > x1 + gap) {
          // Normal case: stepped right-angle path
          const midX = (x1 + x2) / 2;
          path = `M ${x1},${y1} H ${midX} V ${y2} H ${x2}`;
        } else {
          // Tight/overlapping case: go around below both tasks
          const belowY = Math.max(y1, y2) + 48; // Below both bars
          path = `M ${x1},${y1} H ${x1 + gap} V ${belowY} H ${x2 - gap} V ${y2} H ${x2}`;
        }

        return (
          <g key={id}>
            {/* Arrow path */}
            <path
              d={path}
              stroke="var(--text-muted)"
              strokeWidth="1"
              fill="none"
            />
            {/* Arrowhead */}
            <polygon
              points={`${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize / 2} ${x2 - arrowSize},${y2 + arrowSize / 2}`}
              fill="var(--text-muted)"
            />
          </g>
        );
      })}
    </svg>
  );
});

GanttDependencyArrows.displayName = "GanttDependencyArrows";
