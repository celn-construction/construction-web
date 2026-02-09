import { useEffect } from 'react';
import type { RefObject } from 'react';
import { differenceInMonths } from 'date-fns';
import type { TimelineData } from '../../types';

export interface UseAutoScrollToTodayOptions {
  scrollRef: RefObject<HTMLDivElement | null>;
  timelineData: TimelineData;
  zoom: number;
  columnWidth: number;
}

/**
 * Auto-scrolls the Gantt chart to today's position on mount
 * Uses smooth scrolling behavior for better UX
 */
export function useAutoScrollToToday({
  scrollRef,
  timelineData,
  zoom,
  columnWidth,
}: UseAutoScrollToTodayOptions): void {
  useEffect(() => {
    if (scrollRef.current && timelineData.length > 0) {
      const today = new Date();
      const firstYear = timelineData[0]?.year ?? today.getFullYear();
      const timelineStart = new Date(firstYear, 0, 1);

      const monthsOffset = differenceInMonths(today, timelineStart);
      const adjustedColumnWidth = (zoom / 100) * columnWidth;
      const scrollPosition = Math.max(0, (monthsOffset - 1) * adjustedColumnWidth);

      setTimeout(() => {
        scrollRef.current?.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [scrollRef, timelineData, zoom, columnWidth]);
}
