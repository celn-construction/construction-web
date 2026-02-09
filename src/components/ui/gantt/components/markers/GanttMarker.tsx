'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { TrashIcon } from 'lucide-react';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import type { GanttMarkerProps } from '../../types';
import { getOffset } from '../../utils';

export const GanttMarker: FC<
  GanttMarkerProps & {
    onRemove?: (id: string) => void;
    className?: string;
  }
> = ({ label, date, id, onRemove, className }) => {
  const gantt = useContext(GanttContext);
  // Use same getOffset function as GanttFeatureItem for consistency
  const timelineYear = gantt.timelineData.at(0)?.year ?? date.getFullYear();
  const timelineStartDate = new Date(timelineYear, 0, 1);
  const offset = getOffset(date, timelineStartDate, gantt);
  const handleRemove = () => onRemove?.(id);

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(${offset}px)`,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border-color)] px-2 py-1 text-gray-900 dark:text-[var(--text-primary)] text-xs',
              className
            )}
          >
            {label}
            <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
              {formatDate(date, 'MMM dd, yyyy')}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onRemove ? (
            <ContextMenuItem
              className="flex items-center gap-2 text-destructive"
              onClick={handleRemove}
            >
              <TrashIcon size={16} />
              Remove marker
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <div className={cn('h-full w-px bg-gray-300', className)} />
    </div>
  );
};
