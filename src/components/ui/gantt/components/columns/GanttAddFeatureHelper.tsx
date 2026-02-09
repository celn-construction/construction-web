'use client';

import { cn } from '@/lib/utils';
import { useMouse } from '@uidotdev/usehooks';
import { PlusIcon } from 'lucide-react';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext, useGanttScrollX } from '../../context';
import { getDateByMousePosition } from '../../utils';

export type GanttAddFeatureHelperProps = {
  top: number;
  rowIndex?: number;
  className?: string;
};

export const GanttAddFeatureHelper: FC<GanttAddFeatureHelperProps> = ({
  top,
  rowIndex,
  className,
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();

  const handleClick = () => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const currentDate = getDateByMousePosition(gantt, x);

    gantt.onAddItem?.(currentDate);
  };

  return (
    <div
      className={cn('absolute top-0 w-full', className)}
      style={{
        height: gantt.rowHeight,
        transform: `translateY(${top}px)`,
      }}
      ref={mouseRef}
    >
      <button
        onClick={handleClick}
        type="button"
        className="flex h-full w-full items-center justify-center bg-blue-50/50 dark:bg-blue-900/20 border border-dashed border-blue-300 dark:border-blue-600 transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/40"
      >
        <PlusIcon
          size={16}
          className="pointer-events-none select-none text-blue-400 dark:text-blue-300"
        />
      </button>
    </div>
  );
};
