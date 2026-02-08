"use client";

import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useGroupedFeaturesWithRows } from "@/store/hooks/useGanttFeatures";
import { useGroups } from "@/store/hooks/useGanttFeatures";
import { useMoveFeature } from "@/store/hooks/useFeatureActions";
import type { ZoomLevel } from "./types";
import { useGanttTimeline } from "./hooks/useGanttTimeline";
import { useRowBuilder } from "./hooks/useRowBuilder";
import { GanttTimelineHeader } from "./GanttTimelineHeader";
import { GanttRow } from "./components/GanttRow";
import { GanttGridBackground } from "./components/GanttGridBackground";
import { ROW_HEIGHT, LEFT_PANEL_WIDTH } from "./constants";

interface Props {
  zoom: ZoomLevel;
}

export function TanStackGanttChart({ zoom }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { grouped } = useGroupedFeaturesWithRows();
  const groupList = useGroups();

  // Build flat row list using the dedicated hook
  const { rows, featureMap } = useRowBuilder({
    groups: groupList.map((name, idx) => ({ id: name, name, order: idx })),
    groupedFeatures: grouped,
  });

  const moveFeature = useMoveFeature();
  const handleBarDrag = useCallback(
    (id: string, newStart: Date, newEnd: Date) => moveFeature(id, newStart, newEnd),
    [moveFeature],
  );

  const { columns, totalWidth, columnWidth, dateToX, xToDate } = useGanttTimeline(
    Array.from(featureMap.values()),
    zoom,
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-full border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950">
      {/* Header row */}
      <div className="flex shrink-0">
        <div
          className="shrink-0 bg-zinc-900 border-b border-r border-zinc-700 flex items-center px-3 text-xs font-semibold text-zinc-300"
          style={{ width: LEFT_PANEL_WIDTH, minHeight: 32 }}
        >
          Task
        </div>
        <div className="overflow-hidden flex-1">
          <GanttTimelineHeader columns={columns} columnWidth={columnWidth} />
        </div>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: LEFT_PANEL_WIDTH + totalWidth,
            position: "relative",
          }}
        >
          {/* Grid background rendered once */}
          <GanttGridBackground
            columns={columns.map((c) => c.date)}
            dateToX={dateToX}
            columnWidth={columnWidth}
            height={virtualizer.getTotalSize()}
          />

          {/* Virtualized rows */}
          {virtualizer.getVirtualItems().map((vRow) => {
            const row = rows[vRow.index]!;

            return (
              <div
                key={vRow.key}
                className="absolute top-0 left-0"
                style={{
                  height: ROW_HEIGHT,
                  width: LEFT_PANEL_WIDTH + totalWidth,
                  transform: `translateY(${vRow.start}px)`,
                }}
              >
                <GanttRow
                  row={row}
                  rowHeight={ROW_HEIGHT}
                  leftPanelWidth={LEFT_PANEL_WIDTH}
                  dateToX={dateToX}
                  xToDate={xToDate}
                  onFeatureDragEnd={handleBarDrag}
                  featureMap={featureMap}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
