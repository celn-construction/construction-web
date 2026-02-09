import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import throttle from 'lodash.throttle';
import { useGanttScrollX, useGanttScrollY } from '@/store/useGanttUIStore';
import type { Range, TimelineData } from '../../types';
import { createYearData } from '../../utils/dateCalculations';

export interface UseScrollTrackingOptions {
  scrollRef: RefObject<HTMLDivElement | null>;
  timelineData?: TimelineData;
  setTimelineData?: Dispatch<SetStateAction<TimelineData>>;
  columnWidth?: number;
  zoom?: number;
  range?: Range;
}

export interface UseScrollTrackingResult {
  handleScroll: () => void;
  canScrollLeft: boolean;
}

/**
 * Throttled scroll tracking that syncs scroll position to Zustand store
 * and manages fade indicators for horizontal scroll boundaries.
 * Also handles infinite scroll timeline extension.
 */
export function useScrollTracking({
  scrollRef,
  timelineData,
  setTimelineData,
  columnWidth,
  zoom,
  range,
}: UseScrollTrackingOptions): UseScrollTrackingResult {
  const [, setScrollX] = useGanttScrollX();
  const [, setScrollY] = useGanttScrollY();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const isExtendingRef = useRef(false);

  // Update scroll fade indicators
  const updateScrollIndicators = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const threshold = 10;

    setCanScrollLeft(scrollLeft > threshold);
  }, [scrollRef]);

  // Boundary detection for infinite scroll extension
  const checkBoundaries = useCallback(() => {
    if (!scrollRef.current || !timelineData || !setTimelineData || !columnWidth || !zoom || !range) return;
    if (isExtendingRef.current) return; // Prevent re-entrant extension

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    // Left boundary: prepend previous year
    if (scrollLeft < 1) {
      isExtendingRef.current = true;
      const firstYear = timelineData[0]?.year;
      if (!firstYear) {
        isExtendingRef.current = false;
        return;
      }

      const newYearData = createYearData(firstYear - 1);
      const parsedColumnWidth = (columnWidth * zoom) / 100;

      // Calculate width of prepended year
      let prependedWidth = 0;
      if (range === 'monthly') {
        prependedWidth = 12 * parsedColumnWidth;
      } else if (range === 'quarterly') {
        prependedWidth = 4 * parsedColumnWidth;
      } else {
        prependedWidth = 365 * parsedColumnWidth;
      }

      setTimelineData([newYearData, ...timelineData]);

      // Adjust scroll position to prevent visual jump
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = prependedWidth;
        }
        isExtendingRef.current = false;
      });
    }

    // Right boundary: append next year
    if (scrollLeft + clientWidth >= scrollWidth - 1) {
      isExtendingRef.current = true;
      const lastYear = timelineData[timelineData.length - 1]?.year;
      if (!lastYear) {
        isExtendingRef.current = false;
        return;
      }

      const newYearData = createYearData(lastYear + 1);
      setTimelineData([...timelineData, newYearData]);

      requestAnimationFrame(() => {
        isExtendingRef.current = false;
      });
    }
  }, [scrollRef, timelineData, setTimelineData, columnWidth, zoom, range]);

  // Throttled boundary check
  const throttledBoundaryCheck = useMemo(
    () => throttle(checkBoundaries, 100),
    [checkBoundaries]
  );

  // Track scroll position - throttled for performance
  // Native browser physics handles momentum - we just track position
  const handleScroll = useMemo(
    () =>
      throttle(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollTop } = scrollRef.current;
        setScrollX(scrollLeft);
        setScrollY(scrollTop);
        updateScrollIndicators();
        throttledBoundaryCheck();
      }, 16), // ~60fps throttle
    [setScrollX, setScrollY, updateScrollIndicators, throttledBoundaryCheck]
  );

  // Initialize scroll tracking
  useEffect(() => {
    updateScrollIndicators();

    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, updateScrollIndicators, scrollRef]);

  return {
    handleScroll,
    canScrollLeft,
  };
}
