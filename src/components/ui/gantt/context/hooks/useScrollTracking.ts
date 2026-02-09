import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import throttle from 'lodash.throttle';
import { useGanttScrollX, useGanttScrollY } from '@/store/useGanttUIStore';

export interface UseScrollTrackingOptions {
  scrollRef: RefObject<HTMLDivElement | null>;
}

export interface UseScrollTrackingResult {
  handleScroll: () => void;
  canScrollLeft: boolean;
}

/**
 * Throttled scroll tracking that syncs scroll position to Zustand store
 * and manages fade indicators for horizontal scroll boundaries
 */
export function useScrollTracking({
  scrollRef,
}: UseScrollTrackingOptions): UseScrollTrackingResult {
  const [, setScrollX] = useGanttScrollX();
  const [, setScrollY] = useGanttScrollY();
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  // Update scroll fade indicators
  const updateScrollIndicators = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const threshold = 10;

    setCanScrollLeft(scrollLeft > threshold);
  }, [scrollRef]);

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
      }, 16), // ~60fps throttle
    [setScrollX, setScrollY, updateScrollIndicators]
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
