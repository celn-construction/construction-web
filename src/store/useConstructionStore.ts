'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GanttFeature, GanttStatus } from '@/types/gantt-types';

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
  'Site Prep',
  'Foundation',
  'Framing',
  'MEP Systems',
  'Finishing',
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
  // Site Prep - 3 features, 2 sub-rows (Survey+Demolition share row 0, Grading overlaps Demo → row 1)
  {
    id: 'task-1',
    name: 'Site Survey',
    status: COMPLETED_STATUS,
    group: 'Site Prep',
    startAt: new Date('2026-02-01'),
    endAt: new Date('2026-02-07'),
    progress: 100,
  },
  {
    id: 'task-2',
    name: 'Demolition',
    status: COMPLETED_STATUS,
    group: 'Site Prep',
    startAt: new Date('2026-02-08'),
    endAt: new Date('2026-02-18'),
    progress: 100,
  },
  {
    id: 'task-3',
    name: 'Grading & Excavation',
    status: IN_PROGRESS_STATUS,
    group: 'Site Prep',
    startAt: new Date('2026-02-12'),
    endAt: new Date('2026-02-22'),
    progress: 65,
  },
  // Foundation - 3 features, 2 sub-rows (cascading overlaps)
  {
    id: 'task-4',
    name: 'Footings',
    status: IN_PROGRESS_STATUS,
    group: 'Foundation',
    startAt: new Date('2026-02-20'),
    endAt: new Date('2026-03-05'),
    progress: 40,
  },
  {
    id: 'task-5',
    name: 'Slab Pour',
    status: PLANNED_STATUS,
    group: 'Foundation',
    startAt: new Date('2026-03-03'),
    endAt: new Date('2026-03-12'),
    progress: 0,
  },
  {
    id: 'task-6',
    name: 'Waterproofing',
    status: PLANNED_STATUS,
    group: 'Foundation',
    startAt: new Date('2026-03-10'),
    endAt: new Date('2026-03-18'),
    progress: 0,
  },
  // Framing - 2 features, 2 sub-rows (overlap)
  {
    id: 'task-7',
    name: 'Structural Steel',
    status: PLANNED_STATUS,
    group: 'Framing',
    startAt: new Date('2026-03-15'),
    endAt: new Date('2026-04-05'),
    progress: 0,
  },
  {
    id: 'task-8',
    name: 'Roof Framing',
    status: PLANNED_STATUS,
    group: 'Framing',
    startAt: new Date('2026-04-01'),
    endAt: new Date('2026-04-15'),
    progress: 0,
  },
  // MEP Systems - 3 features, 2 sub-rows (cascading)
  {
    id: 'task-9',
    name: 'Electrical Rough-in',
    status: PLANNED_STATUS,
    group: 'MEP Systems',
    startAt: new Date('2026-03-25'),
    endAt: new Date('2026-04-12'),
    progress: 0,
  },
  {
    id: 'task-10',
    name: 'Plumbing Rough-in',
    status: PLANNED_STATUS,
    group: 'MEP Systems',
    startAt: new Date('2026-03-28'),
    endAt: new Date('2026-04-10'),
    progress: 0,
  },
  {
    id: 'task-11',
    name: 'HVAC Install',
    status: PLANNED_STATUS,
    group: 'MEP Systems',
    startAt: new Date('2026-04-08'),
    endAt: new Date('2026-04-22'),
    progress: 0,
  },
  // Finishing - 1 feature, 1 sub-row
  {
    id: 'task-12',
    name: 'Drywall & Paint',
    status: PLANNED_STATUS,
    group: 'Finishing',
    startAt: new Date('2026-04-18'),
    endAt: new Date('2026-05-08'),
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
        version: 3,
        partialize: (state) => ({
          features: state.features,
          groups: state.groups,
        }),
        // Rehydrate dates from localStorage (JSON serializes them as strings)
        onRehydrateStorage: () => (state) => {
          if (state?.features) {
            state.features = state.features.map((feature) => ({
              ...feature,
              // Convert string dates back to Date objects
              startAt: feature.startAt ? new Date(feature.startAt) : feature.startAt,
              endAt: feature.endAt ? new Date(feature.endAt) : feature.endAt,
            }));
          }
        },
        migrate: (persistedState: unknown, version: number) => {
          // Force reset to new defaults for version 3 (construction-themed data)
          if (version < 3) {
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
