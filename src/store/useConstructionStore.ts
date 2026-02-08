'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GanttFeature, GanttStatus } from '@/components/ui/gantt/types';

// ============================================================================
// TYPES
// ============================================================================

type FeatureId = string;
type GroupName = string;

interface ConstructionState {
  // ========== DOMAIN DATA ==========
  features: GanttFeature[];

  // ========== METADATA ==========
  groups: GroupName[];
  statuses: Record<string, GanttStatus>;

  // ========== ACTIONS ==========
  // Feature CRUD
  addFeature: (feature: GanttFeature) => void;
  updateFeature: (id: FeatureId, updates: Partial<GanttFeature>) => void;
  removeFeature: (id: FeatureId) => void;

  // Feature movement (drag/drop)
  moveFeature: (id: FeatureId, startAt: Date, endAt: Date) => void;

  // Batch operations
  updateMultipleFeatures: (updates: Array<{ id: FeatureId; changes: Partial<GanttFeature> }>) => void;
  reorderGroup: (groupName: GroupName, featureIds: FeatureId[]) => void;

  // Initialization
  initializeFeatures: (features: GanttFeature[]) => void;
}

interface ConstructionSelectors {
  // Group-based queries
  getFeaturesByGroup: (groupName: GroupName) => GanttFeature[];
  getAllGroupedFeatures: () => Record<GroupName, GanttFeature[]>;

  // Feature queries
  getFeatureById: (id: FeatureId) => GanttFeature | undefined;
  getFeaturesByStatus: (statusId: string) => GanttFeature[];

  // Visual/layout queries
  getTotalRows: () => number;
  getFlatFeaturesWithIndex: () => Array<{ feature: GanttFeature; rowIndex: number; group: GroupName }>;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_GROUPS: GroupName[] = [
  'Design',
  'Development',
  'Testing',
];

// Define statuses as strongly typed constants
const COMPLETED_STATUS: GanttStatus = { id: 'completed', name: 'Completed', color: '#10b981' };
const IN_PROGRESS_STATUS: GanttStatus = { id: 'in-progress', name: 'In Progress', color: '#3b82f6' };
const PLANNED_STATUS: GanttStatus = { id: 'planned', name: 'Planned', color: '#6b7280' };

const DEFAULT_STATUSES: Record<string, GanttStatus> = {
  completed: COMPLETED_STATUS,
  'in-progress': IN_PROGRESS_STATUS,
  planned: PLANNED_STATUS,
};

const DEFAULT_FEATURES: GanttFeature[] = [
  {
    id: 'task-1',
    name: 'Project Planning',
    status: COMPLETED_STATUS,
    group: 'Design',
    startAt: new Date('2026-02-01'),
    endAt: new Date('2026-02-14'),
    progress: 100,
  },
  {
    id: 'task-2',
    name: 'UI Design',
    status: IN_PROGRESS_STATUS,
    group: 'Design',
    startAt: new Date('2026-02-10'),
    endAt: new Date('2026-02-28'),
    progress: 60,
  },
  {
    id: 'task-3',
    name: 'Frontend Development',
    status: PLANNED_STATUS,
    group: 'Development',
    startAt: new Date('2026-02-24'),
    endAt: new Date('2026-03-21'),
    progress: 0,
  },
  {
    id: 'task-4',
    name: 'Backend API',
    status: PLANNED_STATUS,
    group: 'Development',
    startAt: new Date('2026-03-01'),
    endAt: new Date('2026-03-28'),
    progress: 0,
  },
  {
    id: 'task-5',
    name: 'Integration Testing',
    status: PLANNED_STATUS,
    group: 'Testing',
    startAt: new Date('2026-03-21'),
    endAt: new Date('2026-04-04'),
    progress: 0,
  },
];

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useConstructionStore = create<ConstructionState & ConstructionSelectors>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state - populated with sample construction tasks
        features: DEFAULT_FEATURES,
        groups: DEFAULT_GROUPS,
        statuses: DEFAULT_STATUSES,

        // ========== ACTIONS ==========

        addFeature: (feature) =>
          set((state) => {
            state.features.push(feature);
          }),

        updateFeature: (id, updates) =>
          set((state) => {
            const index = state.features.findIndex((f) => f.id === id);
            const existing = state.features[index];
            if (index !== -1 && existing) {
              // Create new object to trigger proper reactivity with useShallow
              state.features[index] = { ...existing, ...updates };
            }
          }),

        removeFeature: (id) =>
          set((state) => {
            state.features = state.features.filter((f) => f.id !== id);
          }),

        moveFeature: (id, startAt, endAt) =>
          set((state) => {
            const feature = state.features.find((f) => f.id === id);
            if (feature) {
              feature.startAt = startAt;
              feature.endAt = endAt;
            }
          }),

        updateMultipleFeatures: (updates) =>
          set((state) => {
            updates.forEach(({ id, changes }) => {
              const feature = state.features.find((f) => f.id === id);
              if (feature) {
                Object.assign(feature, changes);
              }
            });
          }),

        reorderGroup: (groupName, featureIds) =>
          set((state) => {
            const groupFeatures = state.features.filter((f) => f.group === groupName);
            const reordered = featureIds
              .map((id) => groupFeatures.find((f) => f.id === id))
              .filter(Boolean) as GanttFeature[];

            const otherFeatures = state.features.filter((f) => f.group !== groupName);
            state.features = [...otherFeatures, ...reordered];
          }),

        initializeFeatures: (features) =>
          set((state) => {
            state.features = features;
          }),

        // ========== SELECTORS ==========

        getFeaturesByGroup: (groupName) => {
          return get().features.filter((f) => f.group === groupName);
        },

        getAllGroupedFeatures: () => {
          const { features, groups } = get();
          return groups.reduce(
            (acc, groupName) => {
              acc[groupName] = features.filter((f) => f.group === groupName);
              return acc;
            },
            {} as Record<GroupName, GanttFeature[]>
          );
        },

        getFeatureById: (id) => {
          return get().features.find((f) => f.id === id);
        },

        getFeaturesByStatus: (statusId) => {
          return get().features.filter((f) => f.status.id === statusId);
        },

        getTotalRows: () => {
          return get().features.length;
        },

        getFlatFeaturesWithIndex: () => {
          const { groups } = get();
          const groupedFeatures = get().getAllGroupedFeatures();

          return Object.entries(groupedFeatures).flatMap(
            ([group, groupFeatures], groupIndex) => {
              const previousGroupsFeatures = Object.values(groupedFeatures)
                .slice(0, groupIndex)
                .reduce((sum, g) => sum + g.length, 0);

              return groupFeatures.map((feature, indexInGroup) => ({
                feature,
                rowIndex: previousGroupsFeatures + indexInGroup,
                group,
              }));
            }
          );
        },
      })),
      {
        name: 'construction-storage',
        version: 2, // Bumped to force reset with simplified data
        partialize: (state) => ({
          features: state.features,
          groups: state.groups,
        }),
        // Rehydrate dates from localStorage (JSON serializes them as strings)
        onRehydrateStorage: () => (state) => {
          if (state?.features) {
            state.features = state.features.map((feature) => ({
              ...feature,
              // Only convert to Date if value exists (unscheduled issues have no dates)
              startAt: feature.startAt ? new Date(feature.startAt) : undefined,
              endAt: feature.endAt ? new Date(feature.endAt) : undefined,
            }));
          }
        },
        migrate: (persistedState: unknown, version: number) => {
          // Force reset to new defaults for version 2 (simplified data)
          if (version < 2) {
            return {
              features: DEFAULT_FEATURES,
              groups: DEFAULT_GROUPS,
            };
          }
          return persistedState as { features: GanttFeature[]; groups: GroupName[] };
        },
      }
    ),
    { name: 'ConstructionStore' }
  )
);

// Export types for external use
export type { ConstructionState, ConstructionSelectors, FeatureId, GroupName };
