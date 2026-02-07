/**
 * Hook for managing drag interaction on Gantt timeline bars
 * Handles pointer capture, offset tracking, and drag state
 */

import { useState, useCallback } from 'react';
import type { PointerEvent } from 'react';
import { CLICK_THRESHOLD } from '../constants';

interface UseBarDragParams {
  dateToX: (date: Date) => number;
  xToDate: (x: number) => Date;
  startAt: Date;
  endAt: Date;
  onDragEnd: (newStart: Date, newEnd: Date) => void;
}

interface UseBarDragReturn {
  dragOffset: number | null;
  isDragging: boolean;
  pointerHandlers: {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  };
}

export function useBarDrag({
  dateToX,
  xToDate,
  startAt,
  endAt,
  onDragEnd,
}: UseBarDragParams): UseBarDragReturn {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startAt: Date; endAt: Date } | null>(null);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      setDragStart({ x: e.clientX, startAt, endAt });
      setDragOffset(localX);
    },
    [startAt, endAt]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (dragStart === null) return;

      const dx = e.clientX - dragStart.x;
      if (Math.abs(dx) < CLICK_THRESHOLD) return;

      const duration = dragStart.endAt.getTime() - dragStart.startAt.getTime();
      const newStartX = dateToX(dragStart.startAt) + dx;
      const newStart = xToDate(newStartX);
      const newEnd = new Date(newStart.getTime() + duration);

      // Update visual feedback
      setDragOffset(dragOffset !== null ? dragOffset : 0);
    },
    [dragStart, dragOffset, dateToX, xToDate]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (dragStart === null) {
        setDragOffset(null);
        return;
      }

      const dx = e.clientX - dragStart.x;
      if (Math.abs(dx) >= CLICK_THRESHOLD) {
        const duration = dragStart.endAt.getTime() - dragStart.startAt.getTime();
        const newStartX = dateToX(dragStart.startAt) + dx;
        const newStart = xToDate(newStartX);
        const newEnd = new Date(newStart.getTime() + duration);
        onDragEnd(newStart, newEnd);
      }

      setDragStart(null);
      setDragOffset(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [dragStart, dateToX, xToDate, onDragEnd]
  );

  return {
    dragOffset,
    isDragging: dragStart !== null,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
