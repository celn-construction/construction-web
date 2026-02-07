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
  'Foundation & Site Work',
  'Structural Work',
  'MEP (Mechanical, Electrical, Plumbing)',
  'Finishing & Inspection',
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

// Realistic construction timeline (~4 months, Feb-Jun 2025)
const DEFAULT_FEATURES: GanttFeature[] = [
  // Foundation & Site Work
  {
    id: 'task-1',
    name: 'Site Clearing & Grading',
    status: COMPLETED_STATUS,
    group: 'Foundation & Site Work',
    startAt: new Date('2025-02-01'),
    endAt: new Date('2025-02-14'),
    progress: 100,
  },
  {
    id: 'task-2',
    name: 'Foundation Excavation',
    status: COMPLETED_STATUS,
    group: 'Foundation & Site Work',
    startAt: new Date('2025-02-10'),
    endAt: new Date('2025-02-28'),
    progress: 100,
  },
  {
    id: 'task-3',
    name: 'Concrete Pouring',
    status: IN_PROGRESS_STATUS,
    group: 'Foundation & Site Work',
    startAt: new Date('2025-02-24'),
    endAt: new Date('2025-03-14'),
    progress: 65,
  },

  // Structural Work
  {
    id: 'task-4',
    name: 'Steel Frame Erection',
    status: IN_PROGRESS_STATUS,
    group: 'Structural Work',
    startAt: new Date('2025-03-10'),
    endAt: new Date('2025-04-04'),
    progress: 30,
  },
  {
    id: 'task-5',
    name: 'Roof Truss Installation',
    status: PLANNED_STATUS,
    group: 'Structural Work',
    startAt: new Date('2025-03-28'),
    endAt: new Date('2025-04-18'),
    progress: 0,
  },
  {
    id: 'task-6',
    name: 'Exterior Wall Framing',
    status: PLANNED_STATUS,
    group: 'Structural Work',
    startAt: new Date('2025-04-07'),
    endAt: new Date('2025-04-25'),
    progress: 0,
  },

  // MEP (Mechanical, Electrical, Plumbing)
  {
    id: 'task-7',
    name: 'Rough Plumbing',
    status: PLANNED_STATUS,
    group: 'MEP (Mechanical, Electrical, Plumbing)',
    startAt: new Date('2025-04-01'),
    endAt: new Date('2025-04-18'),
    progress: 0,
  },
  {
    id: 'task-8',
    name: 'Electrical Wiring',
    status: PLANNED_STATUS,
    group: 'MEP (Mechanical, Electrical, Plumbing)',
    startAt: new Date('2025-04-10'),
    endAt: new Date('2025-05-02'),
    progress: 0,
  },
  {
    id: 'task-9',
    name: 'HVAC Installation',
    status: PLANNED_STATUS,
    group: 'MEP (Mechanical, Electrical, Plumbing)',
    startAt: new Date('2025-04-21'),
    endAt: new Date('2025-05-16'),
    progress: 0,
  },

  // Finishing & Inspection
  {
    id: 'task-10',
    name: 'Drywall Installation',
    status: PLANNED_STATUS,
    group: 'Finishing & Inspection',
    startAt: new Date('2025-05-05'),
    endAt: new Date('2025-05-23'),
    progress: 0,
  },
  {
    id: 'task-11',
    name: 'Interior Painting',
    status: PLANNED_STATUS,
    group: 'Finishing & Inspection',
    startAt: new Date('2025-05-19'),
    endAt: new Date('2025-06-06'),
    progress: 0,
  },
  {
    id: 'task-12',
    name: 'Final Inspection',
    status: PLANNED_STATUS,
    group: 'Finishing & Inspection',
    startAt: new Date('2025-06-02'),
    endAt: new Date('2025-06-06'),
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
        version: 1, // Bump version to force migration to new defaults with dates
        partialize: (state) => ({
          features: state.features,
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
          // Force reset to new defaults with dates for all versions < 1
          if (version < 1) {
            return {
              features: DEFAULT_FEATURES,
            };
          }
          return persistedState as { features: GanttFeature[] };
        },
      }
    ),
    { name: 'ConstructionStore' }
  )
);

// Export types for external use
export type { ConstructionState, ConstructionSelectors, FeatureId, GroupName };
