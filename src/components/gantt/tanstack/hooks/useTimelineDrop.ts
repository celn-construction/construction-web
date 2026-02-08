import { useState, type DragEvent, type RefObject } from "react";
import { addDays } from "date-fns";
import type { GanttFeature } from "@/components/ui/gantt/types/core.types";
import type { RowItem } from "./useRowBuilder";
import { ROW_HEIGHT, LEFT_PANEL_WIDTH } from "../constants";

interface DropPreview {
  rowIndex: number;
  groupId: string;
  groupName: string;
  startDate: Date;
  endDate: Date;
  x: number;
}

interface UseTimelineDropParams {
  scrollRef: RefObject<HTMLDivElement | null>;
  rows: RowItem[];
  xToDate: (x: number) => Date;
  dateToX: (date: Date) => number;
  addFeature: (feature: GanttFeature) => void;
}

interface UseTimelineDropReturn {
  dropHandlers: {
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  };
  dropPreview: DropPreview | null;
}

export function useTimelineDrop({
  scrollRef,
  rows,
  xToDate,
  dateToX,
  addFeature,
}: UseTimelineDropParams): UseTimelineDropReturn {
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Check if this is our drag type
    if (!e.dataTransfer.types.includes("application/gantt-new-task")) {
      return;
    }

    e.dataTransfer.dropEffect = "copy";

    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const rect = scrollEl.getBoundingClientRect();
    const scrollTop = scrollEl.scrollTop;
    const scrollLeft = scrollEl.scrollLeft;

    // Calculate row position
    const relativeY = e.clientY - rect.top + scrollTop;
    const rowIndex = Math.floor(relativeY / ROW_HEIGHT);

    // Validate row index
    if (rowIndex < 0 || rowIndex >= rows.length) {
      setDropPreview(null);
      e.dataTransfer.dropEffect = "none";
      return;
    }

    const row = rows[rowIndex];
    if (!row) {
      setDropPreview(null);
      return;
    }

    // Calculate X position (relative to timeline, not left panel)
    const relativeX = e.clientX - rect.left + scrollLeft - LEFT_PANEL_WIDTH;

    // Invalid if over left panel
    if (relativeX < 0) {
      setDropPreview(null);
      e.dataTransfer.dropEffect = "none";
      return;
    }

    // Calculate dates
    const startDate = xToDate(relativeX);
    const endDate = addDays(startDate, 7); // Default 7-day duration

    // Get group info (works for both group header rows and feature rows)
    const groupId = row.groupId || row.id;
    const groupName = row.groupName || row.groupId || "";

    setDropPreview({
      rowIndex,
      groupId,
      groupName,
      startDate,
      endDate,
      x: relativeX,
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!e.dataTransfer.types.includes("application/gantt-new-task")) {
      return;
    }

    if (!dropPreview) {
      return;
    }

    // Create new feature
    const newFeature: GanttFeature = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "New Task",
      startAt: dropPreview.startDate,
      endAt: dropPreview.endDate,
      status: { id: "planned", name: "Planned", color: "#6b7280" },
      group: dropPreview.groupName,
      progress: 0,
    };

    addFeature(newFeature);
    setDropPreview(null);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only clear if we're actually leaving the container
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !scrollRef.current?.contains(relatedTarget)) {
      setDropPreview(null);
    }
  };

  return {
    dropHandlers: {
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onDragLeave: handleDragLeave,
    },
    dropPreview,
  };
}
