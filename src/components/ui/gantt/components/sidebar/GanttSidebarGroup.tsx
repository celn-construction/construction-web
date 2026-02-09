'use client';

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

export type GanttSidebarGroupProps = {
  children: ReactNode;
  name: string;
  taskCount?: number;
  className?: string;
  isFullscreen?: boolean;
};

export const GanttSidebarGroup: FC<GanttSidebarGroupProps> = ({
  children,
  name,
  taskCount = 1,
  className,
  isFullscreen = false,
}) => (
  <div className={cn('flex flex-col', isFullscreen && 'flex-1', className)}>
    {/* Tasks column - no group name column */}
    <div className={cn(
      'flex-1',
      isFullscreen && 'flex flex-col'
    )}>{children}</div>
  </div>
);
