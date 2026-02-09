'use client';

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';
import type { GanttFeature } from '../../types';

export type GanttFeatureRowProps = {
  features: GanttFeature[];
  onMove?: (featureId: string, startAt: Date, endAt: Date) => void;
  children?: (feature: GanttFeature, subRow: number) => ReactNode;
  className?: string;
};

type SubRowAssignment = {
  feature: GanttFeature;
  subRow: number;
};

/**
 * Container for rendering multiple features that share a visual row.
 * Uses greedy sub-row allocation to stack overlapping features vertically.
 */
export const GanttFeatureRow: FC<GanttFeatureRowProps> = ({
  features,
  children,
  className,
}) => {
  // Sort features by startAt for greedy allocation
  const sortedFeatures = [...features].sort((a, b) => {
    if (!a.startAt) return 1;
    if (!b.startAt) return -1;
    return a.startAt.getTime() - b.startAt.getTime();
  });

  // Greedy sub-row allocation
  const subRowEndTimes: (number | null)[] = [];
  const assignments: SubRowAssignment[] = [];

  for (const feature of sortedFeatures) {
    if (!feature.startAt) continue;

    const startTime = feature.startAt.getTime();
    const endTime = feature.endAt?.getTime() ?? startTime;

    // Find first sub-row where this feature fits (endTime <= startTime)
    let assignedSubRow = -1;
    for (let i = 0; i < subRowEndTimes.length; i++) {
      const subRowEnd = subRowEndTimes[i];
      if (subRowEnd === null || (subRowEnd !== undefined && subRowEnd <= startTime)) {
        assignedSubRow = i;
        subRowEndTimes[i] = endTime;
        break;
      }
    }

    // If no sub-row fits, create new one
    if (assignedSubRow === -1) {
      assignedSubRow = subRowEndTimes.length;
      subRowEndTimes.push(endTime);
    }

    assignments.push({ feature, subRow: assignedSubRow });
  }

  const maxSubRows = subRowEndTimes.length || 1;
  const containerHeight = maxSubRows * 36; // 36px per sub-row

  return (
    <div
      className={cn('relative', className)}
      style={{ height: `${containerHeight}px` }}
    >
      {assignments.map(({ feature, subRow }) => (
        <div
          key={feature.id}
          className="absolute w-full"
          style={{ top: `${subRow * 36}px`, height: '36px' }}
        >
          {children?.(feature, subRow)}
        </div>
      ))}
    </div>
  );
};
