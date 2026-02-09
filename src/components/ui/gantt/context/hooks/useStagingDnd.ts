import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  rectIntersection,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import type { StagedTask } from '@/store/useStagingStore';
import type { Range, TimelineData } from '../../types';
import { getMonthBoundsByMousePosition } from '../../utils';
import { useGanttDropTarget } from '@/store/useGanttUIStore';

export interface UseStagingDndOptions {
  enableStaging: boolean;
  onStagedItemDrop?: (stagedTask: StagedTask, startAt: Date, endAt: Date, targetRow: number) => void;
  validDropRows?: number[];
  columnWidth: number;
  headerHeight: number;
  rowHeight: number;
  scrollX: number;
  sidebarWidth: number;
  zoom: number;
  range: Range;
  timelineData: TimelineData;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export interface UseStagingDndResult {
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: typeof rectIntersection;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragMove: (event: DragMoveEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  activeDraggedTask: StagedTask | null;
}

/**
 * Manages drag-and-drop functionality for staging zone items
 * Handles all DnD events, collision detection, and drop validation
 */
export function useStagingDnd({
  enableStaging,
  onStagedItemDrop,
  validDropRows,
  columnWidth,
  headerHeight,
  rowHeight,
  scrollX,
  sidebarWidth,
  zoom,
  range,
  timelineData,
  scrollRef,
}: UseStagingDndOptions): UseStagingDndResult {
  const [activeDraggedTask, setActiveDraggedTask] = useState<StagedTask | null>(null);
  const [, setDropTarget] = useGanttDropTarget();

  // Store the last valid drop target info to ensure drop matches highlight exactly
  // This stores both row and timeline X so handleDragEnd uses the exact same values shown to user
  const lastValidDropRef = useRef<{ targetRow: number; timelineX: number } | null>(null);

  // Configure DnD sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Use standard rectIntersection - staging zone is now inside the same scroll container
  // so cross-container issues no longer exist
  const collisionDetection = rectIntersection;

  // Handle drag start from staging zone
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;

    // Reset the drop target ref at drag start
    lastValidDropRef.current = null;

    // Check if drag started from staging zone (ID starts with 'staged-')
    if (typeof active.id === 'string' && active.id.startsWith('staged-')) {
      const task = active.data.current?.task as StagedTask | undefined;
      if (task) {
        setActiveDraggedTask(task);
      }
    }
  }, []);

  // Handle drag move - update drop target indicator in real-time
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, activatorEvent, delta } = event;

    // Only handle staged items
    if (typeof active.id !== 'string' || !active.id.startsWith('staged-')) {
      return;
    }

    if (!scrollRef.current) {
      return;
    }

    const task = active.data.current?.task as StagedTask | undefined;
    if (!task) {
      return;
    }

    const pointerEvent = activatorEvent as PointerEvent | MouseEvent | undefined;
    if (!pointerEvent) {
      return;
    }

    const containerRect = scrollRef.current.getBoundingClientRect();

    // Calculate current position
    const initialX = (pointerEvent as PointerEvent).clientX ?? 0;
    const initialY = (pointerEvent as PointerEvent).clientY ?? 0;
    const currentX = initialX + delta.x;
    const currentY = initialY + delta.y;

    // Check if outside container bounds - clear indicator and ref
    if (currentY < containerRect.top || currentY > containerRect.bottom ||
        currentX < containerRect.left || currentX > containerRect.right) {
      setDropTarget(null);
      lastValidDropRef.current = null;
      return;
    }

    // Calculate position relative to timeline
    const scrollTop = scrollRef.current.scrollTop;
    const positionInContainer = currentY - containerRect.top;
    const timelineY = positionInContainer - headerHeight + scrollTop;

    // If above the timeline rows (in header or higher), clear indicator and ref
    if (timelineY < 0) {
      setDropTarget(null);
      lastValidDropRef.current = null;
      return;
    }

    // Calculate target row
    const targetRow = Math.max(0, Math.floor(timelineY / rowHeight));

    // Calculate the X position for the drop indicator
    // Add scrollX to convert viewport coordinates to content coordinates
    // The indicator is positioned in content space, mouse is in viewport space
    const timelineX = currentX - containerRect.left - sidebarWidth + scrollX;

    // Store both row AND timelineX in ref so handleDragEnd uses EXACT same values
    // This ensures the drop position matches exactly what the user saw highlighted
    lastValidDropRef.current = { targetRow, timelineX };
    const adjustedColumnWidth = (zoom / 100) * columnWidth;

    // Snap indicator to full column width (matches snap-to-month drop behavior)
    // Calculate which column the mouse is in
    const columnIndex = Math.floor(timelineX / adjustedColumnWidth);
    const snappedOffset = columnIndex * adjustedColumnWidth;

    // Determine if this is a valid drop zone
    const isValidDrop = !validDropRows || validDropRows.includes(targetRow);

    // Update drop target indicator - show full column width
    setDropTarget({
      rowIndex: targetRow,
      offset: Math.max(0, snappedOffset),
      width: adjustedColumnWidth,
      isValid: isValidDrop,
    });
  }, [columnWidth, headerHeight, rowHeight, scrollX, setDropTarget, sidebarWidth, validDropRows, zoom, scrollRef]);

  // Handle drag end - use dnd-kit's event.over for proper row targeting
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, activatorEvent } = event;

    // Clear drag state
    setActiveDraggedTask(null);
    setDropTarget(null);
    lastValidDropRef.current = null;

    // Only handle staged items being dropped
    if (typeof active.id !== 'string' || !active.id.startsWith('staged-')) {
      return;
    }

    const task = active.data.current?.task as StagedTask | undefined;

    if (!task || !onStagedItemDrop || !scrollRef.current) {
      return;
    }

    // Determine target row - either from dnd-kit collision detection or pointer calculation
    let targetRow: number | undefined;

    if (over) {
      // Parse row index from droppable ID (format: "droppable-row-{index}")
      const overId = String(over.id);
      if (overId.startsWith('droppable-row-')) {
        targetRow = parseInt(overId.replace('droppable-row-', ''), 10);
      } else if (over.data.current?.rowIndex !== undefined) {
        // Fallback: check droppable data
        targetRow = over.data.current.rowIndex;
      }
    }

    // Fallback: If dnd-kit didn't detect a row, calculate from pointer position
    if (targetRow === undefined) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const pointerEvent = activatorEvent as PointerEvent | MouseEvent | undefined;

      if (pointerEvent) {
        const delta = event.delta;
        const initialY = (pointerEvent as PointerEvent).clientY ?? 0;
        const currentY = initialY + delta.y;

        // Calculate position relative to timeline
        const scrollTop = scrollRef.current.scrollTop;
        const positionInContainer = currentY - containerRect.top;
        const timelineY = positionInContainer - headerHeight + scrollTop;

        // Only accept if inside the timeline area
        if (timelineY >= 0) {
          targetRow = Math.floor(timelineY / rowHeight);
        }
      }
    }

    // If no row detected at all, cancel the drop
    if (targetRow === undefined) {
      toast.error('Drop cancelled', {
        description: 'Drop the task on the timeline to schedule it',
      });
      return;
    }

    // Validate that the target row is available (not occupied)
    if (validDropRows && !validDropRows.includes(targetRow)) {
      toast.error('This row already has a task scheduled', {
        description: 'Drop the task on an empty row',
      });
      return;
    }

    // Calculate timeline X position for date snapping
    const pointerEvent = activatorEvent as PointerEvent | MouseEvent | undefined;
    if (!pointerEvent) {
      return;
    }

    const containerRect = scrollRef.current.getBoundingClientRect();
    const delta = event.delta;
    const initialX = (pointerEvent as PointerEvent).clientX ?? 0;
    const finalX = initialX + delta.x;
    const timelineX = finalX - containerRect.left - sidebarWidth + scrollX;

    // Snap to full month boundaries
    const { startAt: newStartAt, endAt: newEndAt } = getMonthBoundsByMousePosition(
      { timelineData, columnWidth, zoom, range },
      timelineX
    );

    onStagedItemDrop(task, newStartAt, newEndAt, targetRow);
  }, [onStagedItemDrop, columnWidth, zoom, sidebarWidth, scrollX, timelineData, range, setDropTarget, validDropRows, headerHeight, rowHeight, scrollRef]);

  return {
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    activeDraggedTask,
  };
}
