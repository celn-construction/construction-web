"use client";

import type { GanttFeature } from "@/components/ui/gantt/types/core.types";
import { useBarDrag } from "./hooks/useBarDrag";
import { MIN_BAR_WIDTH } from "./constants";

interface Props {
  feature: GanttFeature;
  dateToX: (d: Date) => number;
  xToDate: (x: number) => Date;
  rowHeight: number;
  onDragEnd: (id: string, newStart: Date, newEnd: Date) => void;
}

export function GanttTimelineBar({ feature, dateToX, xToDate, rowHeight, onDragEnd }: Props) {
  const startAt = feature.startAt ? new Date(feature.startAt) : null;
  const endAt = feature.endAt ? new Date(feature.endAt) : null;

  const { dragOffset, isDragging, pointerHandlers } = useBarDrag({
    dateToX,
    xToDate,
    startAt: startAt!,
    endAt: endAt!,
    onDragEnd: (newStart, newEnd) => onDragEnd(feature.id, newStart, newEnd),
  });

  // Early return AFTER all hooks are called
  if (!startAt || !endAt) return null;

  const left = dateToX(startAt);
  const right = dateToX(endAt);
  const width = Math.max(right - left, MIN_BAR_WIDTH);
  const progress = feature.progress ?? 0;
  const barHeight = rowHeight * 0.5;
  const top = (rowHeight - barHeight) / 2;

  return (
    <div
      className="absolute rounded"
      style={{
        left,
        top,
        width,
        height: barHeight,
        backgroundColor: feature.status.color + "33",
        border: `1px solid ${feature.status.color}`,
        transform: isDragging && dragOffset !== null ? `translateX(${dragOffset}px)` : undefined,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.8 : 1,
        userSelect: "none",
        touchAction: "none",
      }}
      title={`${feature.name} (${progress}%)`}
      {...pointerHandlers}
    >
      {progress > 0 && (
        <div
          className="h-full rounded-l pointer-events-none"
          style={{
            width: `${progress}%`,
            backgroundColor: feature.status.color,
            opacity: 0.7,
          }}
        />
      )}
      <span
        className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-white truncate pointer-events-none"
        style={{ textShadow: "0 0 3px rgba(0,0,0,0.6)" }}
      >
        {feature.name}
      </span>
    </div>
  );
}
