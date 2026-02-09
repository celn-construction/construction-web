'use client';

import { cn } from '@/lib/utils';
import { useContext, useId } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import { GanttDroppableRow } from '../GanttDroppableRow';

export type GanttRowGridProps = {
  totalRows: number;
  taskRowIndices?: number[]; // Row indices that are actual tasks (not group headers)
  className?: string;
  enableDroppableRows?: boolean; // Enable dnd-kit droppable zones for each row
};

export const GanttRowGrid: FC<GanttRowGridProps> = ({
  totalRows,
  taskRowIndices,
  className,
  enableDroppableRows = false,
}) => {
  const gantt = useContext(GanttContext);
  const id = useId();

  // If taskRowIndices provided, only render those rows; otherwise render all
  const rowsToRender = taskRowIndices ?? Array.from({ length: totalRows }, (_, i) => i);

  return (
    <div
      className={cn('absolute top-0 left-0 w-full', className)}
      style={{
        marginTop: 'var(--gantt-header-height)',
        height: `calc(${totalRows} * var(--gantt-row-height))`,
        // Allow pointer events for droppable rows, but keep visual dividers non-interactive
        pointerEvents: enableDroppableRows ? 'auto' : 'none',
      }}
    >
      {/* Droppable row zones - only rendered when enableDroppableRows is true */}
      {enableDroppableRows && rowsToRender.map((rowIndex) => (
        <GanttDroppableRow
          key={`${id}-droppable-row-${rowIndex}`}
          rowIndex={rowIndex}
          rowHeight={gantt.rowHeight}
        />
      ))}

      {/* Visual row dividers - always rendered */}
      {rowsToRender.map((rowIndex) => (
        <div
          key={`${id}-row-${rowIndex}`}
          className="absolute left-0 w-full h-px bg-gray-200 dark:bg-[var(--border-color)] pointer-events-none"
          style={{
            top: `calc(${rowIndex + 1} * var(--gantt-row-height))`,
            zIndex: 1,
          }}
        />
      ))}
    </div>
  );
};
