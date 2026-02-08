'use client';

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';
import { GanttSidebarHeader } from './GanttSidebarHeader';

export type GanttSidebarProps = {
  children: ReactNode;
  className?: string;
  isFullscreen?: boolean;
  /** Optional staging zone rendered above the "Issues" header with sticky positioning */
  stagingZone?: ReactNode;
};

export const GanttSidebar: FC<GanttSidebarProps> = ({
  children,
  className,
  isFullscreen = false,
  stagingZone,
}) => (
  <div
    data-roadmap-ui="gantt-sidebar"
    className={cn(
      'sticky left-0 z-30 overflow-clip border-gray-200 dark:border-[var(--border-color)] border-r bg-white dark:bg-[var(--bg-card)] transition-colors duration-300',
      isFullscreen ? 'h-full flex flex-col' : 'h-max min-h-full',
      className
    )}
  >
    {/* Staging zone above header - sticky with higher z-index */}
    {stagingZone && (
      <div className="sticky top-0 z-20">
        {stagingZone}
      </div>
    )}
    <GanttSidebarHeader />
    <div className={cn(
      isFullscreen && 'flex-1 overflow-auto flex flex-col'
    )}>{children}</div>
  </div>
);
