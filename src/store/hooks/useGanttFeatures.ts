'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useConstructionStore } from '../useConstructionStore';
import type { GanttFeature, GanttStatus } from '@/types/gantt-types';

type GroupName = string;

// Return types for hooks
interface GroupedFeaturesWithRows {
  grouped: Record<GroupName, GanttFeature[]>;
  flatList: Array<{ feature: GanttFeature; rowIndex: number; group: GroupName }>;
  totalRows: number;
  subtasksByParent: Map<string, GanttFeature[]>;
}

/**
 * Hook to get all grouped features with visual row mapping
 * Select raw state and derive computed values with useMemo to avoid SSR hydration issues
 * Now includes hierarchy support: groups parent features only, builds subtask lookup
 */
export function useGroupedFeaturesWithRows(): GroupedFeaturesWithRows {
  // Select stable state references only
  const { features, groups, collapsedFeatureIds } = useConstructionStore(
    useShallow((state) => ({
      features: state.features,
      groups: state.groups,
      collapsedFeatureIds: state.collapsedFeatureIds,
    }))
  );

  // Derive computed values with useMemo for stable references
  return useMemo(() => {
    // 1. Group only parent features (no parentId) by group name
    const grouped = groups.reduce(
      (acc, groupName) => {
        acc[groupName] = features.filter((f) => f.group === groupName && !f.parentId);
        return acc;
      },
      {} as Record<GroupName, GanttFeature[]>
    );

    // 2. Build subtask lookup map
    const subtasksByParent = new Map<string, GanttFeature[]>();
    for (const feature of features) {
      if (feature.parentId) {
        const existing = subtasksByParent.get(feature.parentId) || [];
        existing.push(feature);
        subtasksByParent.set(feature.parentId, existing);
      }
    }

    // 3. Build flat list interleaving parents with their visible subtasks
    const flatList: Array<{ feature: GanttFeature; rowIndex: number; group: GroupName }> = [];
    let rowIndex = 0;

    for (const [group, groupFeatures] of Object.entries(grouped)) {
      for (const parent of groupFeatures) {
        // Add parent
        flatList.push({ feature: parent, rowIndex: rowIndex++, group });

        // Add visible subtasks if not collapsed
        if (!collapsedFeatureIds.has(parent.id)) {
          const subtasks = subtasksByParent.get(parent.id) || [];
          for (const subtask of subtasks) {
            flatList.push({ feature: subtask, rowIndex: rowIndex++, group });
          }
        }
      }
    }

    return {
      grouped,
      flatList,
      totalRows: flatList.length,
      subtasksByParent,
    };
  }, [features, groups, collapsedFeatureIds]);
}

/**
 * Hook to get a single feature by ID
 * Only re-renders when the specific feature changes
 */
export function useFeature(id: string): GanttFeature | undefined {
  return useConstructionStore((state) => state.getFeatureById(id));
}

/**
 * Hook to get features by group name
 */
export function useFeaturesByGroup(groupName: string): GanttFeature[] {
  return useConstructionStore((state) => state.getFeaturesByGroup(groupName));
}

/**
 * Hook to get features by status
 */
export function useFeaturesByStatus(statusId: string): GanttFeature[] {
  return useConstructionStore((state) => state.getFeaturesByStatus(statusId));
}

/**
 * Hook to get available groups
 */
export function useGroups(): GroupName[] {
  return useConstructionStore((state) => state.groups);
}

/**
 * Hook to get available statuses
 */
export function useStatuses(): Record<string, GanttStatus> {
  return useConstructionStore((state) => state.statuses);
}

/**
 * Hook to get subtasks for a parent feature
 */
export function useSubtasks(parentId: string): GanttFeature[] {
  return useConstructionStore((state) => state.getSubtasks(parentId));
}

/**
 * Hook to check if a feature is collapsed
 */
export function useIsCollapsed(featureId: string): boolean {
  return useConstructionStore((state) => state.isCollapsed(featureId));
}

/**
 * Hook to get all collapsed feature IDs
 */
export function useCollapsedFeatureIds(): Set<string> {
  return useConstructionStore((state) => state.collapsedFeatureIds);
}

/**
 * Hook to get the current project ID
 */
export function useCurrentProjectId(): string | null {
  return useConstructionStore((state) => state.currentProjectId);
}

/**
 * Hook to get the switchProject action
 */
export function useSwitchProject() {
  return useConstructionStore((state) => state.switchProject);
}

/**
 * Hook to get all dependencies for the current project
 */
export function useDependencies() {
  return useConstructionStore((state) => state.getDependencies());
}

/**
 * Hook to get dependencies for a specific feature
 */
export function useDependenciesForFeature(featureId: string) {
  return useConstructionStore((state) => state.getDependenciesForFeature(featureId));
}
