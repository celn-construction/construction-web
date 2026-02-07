/**
 * Hook for building the flat row list for the Gantt virtualizer
 * Single source of truth for row construction logic
 */

import { useMemo } from 'react';
import type { GanttFeature } from '@/components/ui/gantt/types/core.types';

export interface RowItem {
  type: 'group' | 'feature';
  id: string;
  groupId?: string;
  groupName?: string;
  feature?: GanttFeature;
}

interface UseRowBuilderParams {
  groups: Array<{ id: string; name: string; order: number }>;
  groupedFeatures: Record<string, GanttFeature[]>;
}

interface UseRowBuilderReturn {
  rows: RowItem[];
  featureMap: Map<string, GanttFeature>;
}

export function useRowBuilder({ groups, groupedFeatures }: UseRowBuilderParams): UseRowBuilderReturn {
  return useMemo(() => {
    const rows: RowItem[] = [];
    const featureMap = new Map<string, GanttFeature>();

    groups.forEach((group) => {
      // Add group header row
      rows.push({
        type: 'group',
        id: group.id,
        groupId: group.id,
        groupName: group.name,
      });

      // Add feature rows for this group
      const features = groupedFeatures[group.id] || [];
      features.forEach((feature) => {
        rows.push({
          type: 'feature',
          id: feature.id,
          groupId: group.id,
          feature,
        });
        featureMap.set(feature.id, feature);
      });
    });

    return { rows, featureMap };
  }, [groups, groupedFeatures]);
}
