'use client';

import { cn } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import type { FC } from 'react';
import { GanttContext } from '../../context';
import { getOffset } from '../../utils';

export type GanttTodayProps = {
  className?: string;
};

export const GanttToday: FC<GanttTodayProps> = ({ className }) => {
  const label = 'Today';
  const gantt = useContext(GanttContext);
  const [offset, setOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Calculate offset on client-side only to avoid hydration mismatch
  useEffect(() => {
    const date = new Date();
    setCurrentDate(date);
    const timelineYear = gantt.timelineData.at(0)?.year ?? date.getFullYear();
    const timelineStartDate = new Date(timelineYear, 0, 1);
    const calculatedOffset = getOffset(date, timelineStartDate, gantt);
    setOffset(calculatedOffset);
  }, [gantt]);

  // Don't render until client-side calculation is done
  if (currentDate === null) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute top-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        left: `${offset}px`,
      }}
    >
      <div
        className={cn(
          'group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-blue-500 border border-blue-600 px-2 py-1 text-white text-xs font-medium shadow-md hover:scale-105 transition-transform',
          className
        )}
      >
        {label}
        <span className="max-h-[0] overflow-hidden opacity-90 transition-all group-hover:max-h-[2rem]">
          {formatDate(currentDate, 'MMM dd, yyyy')}
        </span>
      </div>
      <div className="h-full w-0.5 bg-blue-500" />
    </div>
  );
};
