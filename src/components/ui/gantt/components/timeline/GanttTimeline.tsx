'use client';

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

export type GanttTimelineProps = {
  children: ReactNode;
  className?: string;
};

export const GanttTimeline: FC<GanttTimelineProps> = ({
  children,
  className,
}) => (
  <div
    data-timeline
    className={cn(
      'relative flex h-full w-max flex-none overflow-clip',
      className
    )}
  >
    {children}
  </div>
);
