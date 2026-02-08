'use client';

import type { FC, ReactNode } from 'react';

export type GanttFeatureListGroupProps = {
  children: ReactNode;
  className?: string;
};

export const GanttFeatureListGroup: FC<GanttFeatureListGroupProps> = ({
  children,
  className,
}) => (
  <div className={className}>
    {children}
  </div>
);
