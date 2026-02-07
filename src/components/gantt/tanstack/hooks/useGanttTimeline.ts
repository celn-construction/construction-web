import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addMonths,
  addWeeks,
  addDays,
  format,
  differenceInDays,
  isBefore,
} from "date-fns";
import type { GanttFeature } from "@/components/ui/gantt/types/core.types";
import type { ZoomLevel, ZoomConfig, TimelineColumn } from "../types";
import { PADDING_DAYS_BEFORE, PADDING_DAYS_AFTER } from "../constants";

const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  month: {
    columnWidth: 120,
    unit: "month",
    formatLabel: (d) => format(d, "MMM yyyy"),
  },
  week: {
    columnWidth: 80,
    unit: "week",
    formatLabel: (d) => format(d, "MMM d"),
  },
  day: {
    columnWidth: 35,
    unit: "day",
    formatLabel: (d) => format(d, "d"),
  },
};

function getRange(features: GanttFeature[]): { start: Date; end: Date } {
  const now = new Date();
  let earliest = now;
  let latest = now;

  for (const f of features) {
    if (f.startAt && isBefore(new Date(f.startAt), earliest))
      earliest = new Date(f.startAt);
    if (f.endAt && isBefore(latest, new Date(f.endAt)))
      latest = new Date(f.endAt);
  }

  // Add padding using constants
  earliest = addDays(earliest, -PADDING_DAYS_BEFORE);
  latest = addDays(latest, PADDING_DAYS_AFTER);

  return { start: earliest, end: latest };
}

// Strategy pattern for cleaner zoom level handling
const ZOOM_STRATEGIES = {
  month: {
    getStart: startOfMonth,
    getEnd: endOfMonth,
    advance: (d: Date) => addMonths(d, 1),
  },
  week: {
    getStart: startOfWeek,
    getEnd: endOfWeek,
    advance: (d: Date) => addWeeks(d, 1),
  },
  day: {
    getStart: startOfDay,
    getEnd: (d: Date) => d,
    advance: (d: Date) => addDays(d, 1),
  },
};

function generateColumns(
  start: Date,
  end: Date,
  zoom: ZoomLevel,
): TimelineColumn[] {
  const cfg = ZOOM_CONFIGS[zoom];
  const strategy = ZOOM_STRATEGIES[zoom];
  const cols: TimelineColumn[] = [];
  let cursor = strategy.getStart(start);
  const boundary = strategy.getEnd(end);

  while (isBefore(cursor, boundary)) {
    cols.push({
      key: cursor.toISOString(),
      label: cfg.formatLabel(cursor),
      date: new Date(cursor),
    });
    cursor = strategy.advance(cursor);
  }

  return cols;
}

export function useGanttTimeline(
  features: GanttFeature[],
  zoom: ZoomLevel,
) {
  return useMemo(() => {
    const cfg = ZOOM_CONFIGS[zoom];
    const range = getRange(features);
    const columns = generateColumns(range.start, range.end, zoom);
    const totalWidth = columns.length * cfg.columnWidth;

    function dateToX(date: Date): number {
      const days = differenceInDays(date, range.start);
      const totalDays = differenceInDays(range.end, range.start);
      if (totalDays === 0) return 0;
      return (days / totalDays) * totalWidth;
    }

    function xToDate(x: number): Date {
      const totalDays = differenceInDays(range.end, range.start);
      const days = totalWidth === 0 ? 0 : (x / totalWidth) * totalDays;
      return addDays(range.start, Math.round(days));
    }

    return { columns, totalWidth, columnWidth: cfg.columnWidth, dateToX, xToDate, range };
  }, [features, zoom]);
}
