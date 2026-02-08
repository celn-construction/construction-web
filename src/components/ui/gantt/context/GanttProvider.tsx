// Gantt chart provider component with custom scrollbars
// Redesigned: Native scroll physics + gutter-based custom scrollbars for X and Y

'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CustomScrollbar } from '../components/CustomScrollbar';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  FC,
  ReactNode,
} from 'react';
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';

import type { Range, TimelineData } from '../types';
import { createInitialTimelineData } from '../utils';
import { GanttContext } from './GanttContext';
import type { StagedTask } from '@/store/useStagingStore';

// Re-export from Zustand store for backwards compatibility
export {
  useGanttDragging,
  useGanttScrollX,
  useGanttDropTarget,
} from '@/store/useGanttUIStore';
export type { DropTargetInfo } from '@/store/useGanttUIStore';

// Import for internal use
import { useGanttScrollX } from '@/store/useGanttUIStore';

// Import composable hooks
import {
  useCSSVariables,
  useScrollTracking,
  useAutoScrollToToday,
  useStagingDnd,
} from './hooks';

export type GanttProviderProps = {
  range?: Range;
  zoom?: number;
  onAddItem?: (date: Date) => void;
  validDropRows?: number[]; // Row indices where items can be dropped
  children: ReactNode;
  className?: string;
  // Staging zone support
  enableStaging?: boolean;
  stagingZone?: ReactNode; // Slot for the staging zone component
  onStagedItemDrop?: (stagedTask: StagedTask, startAt: Date, endAt: Date, targetRow: number) => void;
};

export const GanttProvider: FC<GanttProviderProps> = ({
  zoom = 100,
  range = 'monthly',
  onAddItem,
  validDropRows,
  children,
  className,
  enableStaging = false,
  stagingZone,
  onStagedItemDrop,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timelineData] = useState<TimelineData>(
    createInitialTimelineData(new Date())
  );
  const [scrollX] = useGanttScrollX();
  const [sidebarWidth, setSidebarWidth] = useState(300);

  // Calculate dimensions based on range
  const headerHeight = 60;
  const rowHeight = 36;
  let columnWidth = 50;

  if (range === 'monthly') {
    columnWidth = 150;
  } else if (range === 'quarterly') {
    columnWidth = 100;
  }

  // Compute CSS variables for Gantt chart dimensions
  const cssVariables = useCSSVariables({ range, zoom, sidebarWidth });

  // Update sidebar width after mount when DOM is ready
  useEffect(() => {
    if (scrollRef.current) {
      const sidebarElement = scrollRef.current.querySelector(
        '[data-roadmap-ui="gantt-sidebar"]'
      );
      setSidebarWidth(sidebarElement ? 300 : 0);
    }
  }, [children]);

  // Use composable hooks for Gantt functionality
  const { canScrollLeft } = useScrollTracking({ scrollRef });

  useAutoScrollToToday({
    scrollRef,
    timelineData,
    zoom,
    columnWidth,
  });

  const {
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    activeDraggedTask,
  } = useStagingDnd({
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
  });

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range,
        headerHeight,
        columnWidth,
        sidebarWidth,
        rowHeight,
        onAddItem,
        timelineData,
        placeholderLength: 2,
        ref: scrollRef,
        validDropRows,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="relative flex h-full w-full flex-col">
          {/* Staging zone - sticky left-0 keeps it static during horizontal scroll */}
          {enableStaging && stagingZone && (
            <div
              className="sticky left-0 flex-shrink-0 z-50 bg-white dark:bg-[var(--bg-card)] border-b border-gray-200 dark:border-gray-700 overflow-x-clip"
              style={cssVariables}
            >
              {stagingZone}
            </div>
          )}

          {/* Main area with gutter-based scrollbars */}
          <div className="flex flex-1 min-h-0">
            {/* Content column + X scrollbar gutter */}
            <div className="flex flex-1 flex-col min-w-0">
              {/* Scroll container with fade indicators */}
              <div className="relative flex-1 min-h-0">
                {/* Scroll fade indicator - Left */}
                <motion.div
                  className={cn(
                    'pointer-events-none absolute left-[var(--gantt-sidebar-width)] top-0 z-40 h-full w-16',
                    'bg-gradient-to-r from-black/10 dark:from-black/30 to-transparent'
                  )}
                  style={{ '--gantt-sidebar-width': `${sidebarWidth}px` } as CSSProperties}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: canScrollLeft ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Main scroll container - native scrolling with hidden scrollbars */}
                <div
                  className={cn(
                    'gantt relative grid h-full w-full flex-none select-none overflow-auto rounded-sm bg-secondary',
                    // Hide native scrollbar with CSS
                    'scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    range,
                    className
                  )}
                  style={{
                    ...cssVariables,
                    gridTemplateColumns: 'var(--gantt-sidebar-width) 1fr',
                  }}
                  ref={scrollRef}
                >
                  {children}
                </div>
              </div>

              {/* X-axis scrollbar gutter */}
              <CustomScrollbar
                axis="x"
                scrollRef={scrollRef}
                sidebarOffset={sidebarWidth}
              />
            </div>

            {/* Y-axis scrollbar column - aligns with content rows below header */}
            <div className="flex w-3 flex-col pb-3">
              {/* Header spacer to align scrollbar with content rows */}
              <div style={{ height: headerHeight }} className="flex-shrink-0" />
              {/* Y scrollbar - flex-1 fills remaining height minus X scrollbar gutter */}
              <CustomScrollbar
                axis="y"
                scrollRef={scrollRef}
                className="flex-1 min-h-0"
              />
            </div>
          </div>
        </div>

        {/* Drag overlay for visual feedback during drag */}
        <DragOverlay dropAnimation={null}>
          {activeDraggedTask && (
            <div
              className="rounded-md border-2 border-blue-500 bg-blue-100/90 dark:bg-blue-800/90 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-200 shadow-lg"
              style={{ width: 'auto', minWidth: 100 }}
            >
              {activeDraggedTask.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </GanttContext.Provider>
  );
};
