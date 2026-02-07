"use client";

import type { TimelineColumn } from "./types";

interface Props {
  columns: TimelineColumn[];
  columnWidth: number;
}

export function GanttTimelineHeader({ columns, columnWidth }: Props) {
  return (
    <div className="flex border-b border-zinc-700 bg-zinc-900">
      {columns.map((col) => (
        <div
          key={col.key}
          className="shrink-0 text-center text-[11px] text-zinc-400 py-1.5 border-r border-zinc-800"
          style={{ width: columnWidth }}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}
