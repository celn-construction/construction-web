'use client';

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

export type GanttFeatureListProps = {
  className?: string;
  children: ReactNode;
};

export const GanttFeatureList: FC<GanttFeatureListProps> = ({
  className,
  children,
}) => (
  <div
    className={cn('absolute top-0 left-0 h-full w-max', className)}
    style={{ marginTop: 'var(--gantt-header-height)' }}
  >
    {children}
  </div>
);
