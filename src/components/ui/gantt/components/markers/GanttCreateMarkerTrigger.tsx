'use client';

import { cn } from '@/lib/utils';
import { useMouse, useThrottle, useWindowScroll } from '@uidotdev/usehooks';
import { formatDate } from 'date-fns';
import { PlusIcon } from 'lucide-react';
import { useContext } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import { getDateByMousePosition } from '../../utils';

export type GanttCreateMarkerTriggerProps = {
  onCreateMarker: (date: Date) => void;
  className?: string;
};

export const GanttCreateMarkerTrigger: FC<GanttCreateMarkerTriggerProps> = ({
  onCreateMarker,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [windowScroll] = useWindowScroll();
  const x = useThrottle(
    mousePosition.x -
      (mouseRef.current?.getBoundingClientRect().x ?? 0) -
      (windowScroll.x ?? 0),
    10
  );

  const date = getDateByMousePosition(gantt, x);

  const handleClick = () => onCreateMarker(date);

  return (
    <div
      className={cn(
        'group pointer-events-none absolute top-0 left-0 h-full w-full select-none overflow-visible',
        className
      )}
      ref={mouseRef}
    >
      <div
        className="-ml-2 pointer-events-auto sticky top-6 z-20 flex w-4 flex-col items-center justify-center gap-1 overflow-visible opacity-0 group-hover:opacity-100"
        style={{ transform: `translateX(${x}px)` }}
      >
        <button
          type="button"
          className="z-50 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border-color)]"
          onClick={handleClick}
        >
          <PlusIcon size={12} className="text-gray-500 dark:text-[var(--text-secondary)]" />
        </button>
        <div className="whitespace-nowrap rounded-full border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-card)] px-2 py-1 text-gray-900 dark:text-[var(--text-primary)] text-xs">
          {formatDate(date, 'MMM dd, yyyy')}
        </div>
      </div>
    </div>
  );
};
