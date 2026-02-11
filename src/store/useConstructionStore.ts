'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { GanttFeature, GanttStatus } from '@/types/gantt-types';

enableMapSet();

// ============================================================================
// TYPES
// ============================================================================

type FeatureId = string;
type GroupName = string;

interface ProjectData {
  features: GanttFeature[];
  groups: GroupName[];
  collapsedFeatureIds: Set<string>;
}

interface ConstructionState {
  // ========== PROJECT MANAGEMENT ==========
  currentProjectId: string | null;
  projectData: Record<string, ProjectData>;

  // ========== DOMAIN DATA (active project) ==========
  features: GanttFeature[];

  // ========== METADATA ==========
  groups: GroupName[];
  statuses: Record<string, GanttStatus>;
  collapsedFeatureIds: Set<string>;

  // ========== ACTIONS ==========
  // Project switching
  switchProject: (projectId: string) => void;

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

  // Hierarchy operations
  addSubtask: (parentId: FeatureId, subtask: GanttFeature) => void;
  toggleFeatureCollapse: (featureId: FeatureId) => void;
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

  // Hierarchy queries
  getSubtasks: (parentId: FeatureId) => GanttFeature[];
  isCollapsed: (featureId: FeatureId) => boolean;
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

// Residential Complex default data
const RESIDENTIAL_GROUPS: GroupName[] = [
  'Demolition',
  'Utilities',
  'Structure',
  'Interior',
  'Landscaping',
];

const RESIDENTIAL_FEATURES: GanttFeature[] = [
  {
    id: 'res-task-1',
    name: 'Remove Existing Structures',
    status: COMPLETED_STATUS,
    group: 'Demolition',
    startAt: new Date('2026-01-15'),
    endAt: new Date('2026-01-25'),
    progress: 100,
  },
  {
    id: 'res-task-2',
    name: 'Clear Debris',
    status: COMPLETED_STATUS,
    group: 'Demolition',
    startAt: new Date('2026-01-26'),
    endAt: new Date('2026-02-05'),
    progress: 100,
  },
  {
    id: 'res-task-3',
    name: 'Water Line Installation',
    status: IN_PROGRESS_STATUS,
    group: 'Utilities',
    startAt: new Date('2026-02-06'),
    endAt: new Date('2026-02-20'),
    progress: 55,
  },
  {
    id: 'res-task-4',
    name: 'Electrical Infrastructure',
    status: PLANNED_STATUS,
    group: 'Utilities',
    startAt: new Date('2026-02-18'),
    endAt: new Date('2026-03-05'),
    progress: 0,
  },
  {
    id: 'res-task-5',
    name: 'Building Foundations',
    status: PLANNED_STATUS,
    group: 'Structure',
    startAt: new Date('2026-03-01'),
    endAt: new Date('2026-03-20'),
    progress: 0,
  },
  {
    id: 'res-task-6',
    name: 'Framing & Roof',
    status: PLANNED_STATUS,
    group: 'Structure',
    startAt: new Date('2026-03-18'),
    endAt: new Date('2026-04-10'),
    progress: 0,
  },
  {
    id: 'res-task-7',
    name: 'Drywall Installation',
    status: PLANNED_STATUS,
    group: 'Interior',
    startAt: new Date('2026-04-08'),
    endAt: new Date('2026-04-25'),
    progress: 0,
  },
  {
    id: 'res-task-8',
    name: 'Painting & Flooring',
    status: PLANNED_STATUS,
    group: 'Interior',
    startAt: new Date('2026-04-23'),
    endAt: new Date('2026-05-12'),
    progress: 0,
  },
  {
    id: 'res-task-9',
    name: 'Sod & Irrigation',
    status: PLANNED_STATUS,
    group: 'Landscaping',
    startAt: new Date('2026-05-05'),
    endAt: new Date('2026-05-20'),
    progress: 0,
  },
];

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
  // Sample subtasks for Grading & Excavation
  {
    id: 'task-3-sub-1',
    name: 'Topsoil Removal',
    status: COMPLETED_STATUS,
    group: 'Site Prep',
    parentId: 'task-3',
    startAt: new Date('2026-02-12'),
    endAt: new Date('2026-02-16'),
    progress: 100,
  },
  {
    id: 'task-3-sub-2',
    name: 'Rough Grading',
    status: IN_PROGRESS_STATUS,
    group: 'Site Prep',
    parentId: 'task-3',
    startAt: new Date('2026-02-17'),
    endAt: new Date('2026-02-22'),
    progress: 40,
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
        currentProjectId: null,
        projectData: {},
        features: DEFAULT_FEATURES,
        groups: DEFAULT_GROUPS,
        statuses: DEFAULT_STATUSES,
        collapsedFeatureIds: new Set<string>(),

        // ========== ACTIONS ==========

        switchProject: (projectId) =>
          set((state) => {
            // Save current project data before switching
            if (state.currentProjectId) {
              state.projectData[state.currentProjectId] = {
                features: state.features,
                groups: state.groups,
                collapsedFeatureIds: state.collapsedFeatureIds,
              };
            }

            // Load new project data or use defaults
            const projectData = state.projectData[projectId];
            if (projectData) {
              state.features = projectData.features;
              state.groups = projectData.groups;
              state.collapsedFeatureIds = projectData.collapsedFeatureIds;
            } else {
              // First time visiting this project - use defaults based on project ID
              // We'll use the index (0 or 1) to determine which defaults to use
              const isFirstProject = Object.keys(state.projectData).length === 0;
              if (isFirstProject) {
                state.features = DEFAULT_FEATURES;
                state.groups = DEFAULT_GROUPS;
              } else {
                state.features = RESIDENTIAL_FEATURES;
                state.groups = RESIDENTIAL_GROUPS;
              }
              state.collapsedFeatureIds = new Set<string>();
            }

            state.currentProjectId = projectId;
          }),

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
            // Cascade delete: remove the feature and all its subtasks
            state.features = state.features.filter((f) => f.id !== id && f.parentId !== id);
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

        addSubtask: (parentId, subtask) =>
          set((state) => {
            const parent = state.features.find((f) => f.id === parentId);
            if (!parent) return;

            // Reject if parent is already a subtask (only 1 level deep)
            if (parent.parentId) return;

            // Set the subtask's group and parentId
            subtask.group = parent.group;
            subtask.parentId = parentId;
            state.features.push(subtask);
          }),

        toggleFeatureCollapse: (featureId) =>
          set((state) => {
            if (state.collapsedFeatureIds.has(featureId)) {
              state.collapsedFeatureIds.delete(featureId);
            } else {
              state.collapsedFeatureIds.add(featureId);
            }
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

        getSubtasks: (parentId) => {
          return get().features.filter((f) => f.parentId === parentId);
        },

        isCollapsed: (featureId) => {
          return get().collapsedFeatureIds.has(featureId);
        },
      })),
      {
        name: 'construction-storage',
        version: 5,
        partialize: (state) => {
          // Save current project data before persisting
          const updatedProjectData = { ...state.projectData };
          if (state.currentProjectId) {
            updatedProjectData[state.currentProjectId] = {
              features: state.features,
              groups: state.groups,
              collapsedFeatureIds: state.collapsedFeatureIds,
            };
          }

          return {
            currentProjectId: state.currentProjectId,
            projectData: Object.fromEntries(
              Object.entries(updatedProjectData).map(([id, data]) => [
                id,
                {
                  features: data.features,
                  groups: data.groups,
                  collapsedFeatureIds: Array.from(data.collapsedFeatureIds),
                },
              ])
            ),
            // Persist live state so it rehydrates correctly
            features: state.features,
            groups: state.groups,
            collapsedFeatureIds: Array.from(state.collapsedFeatureIds),
          };
        },
        // Rehydrate dates from localStorage (JSON serializes them as strings)
        onRehydrateStorage: () => (state) => {
          if (state?.projectData) {
            // Rehydrate each project's data
            for (const [projectId, data] of Object.entries(state.projectData)) {
              if (data.features) {
                data.features = data.features.map((feature: GanttFeature) => ({
                  ...feature,
                  startAt: feature.startAt ? new Date(feature.startAt) : feature.startAt,
                  endAt: feature.endAt ? new Date(feature.endAt) : feature.endAt,
                }));
              }
              // Rehydrate Set from array
              if (Array.isArray((data as any).collapsedFeatureIds)) {
                data.collapsedFeatureIds = new Set((data as any).collapsedFeatureIds);
              }
            }
          }
          // Rehydrate current project's live state
          if (state?.features) {
            state.features = state.features.map((feature) => ({
              ...feature,
              startAt: feature.startAt ? new Date(feature.startAt) : feature.startAt,
              endAt: feature.endAt ? new Date(feature.endAt) : feature.endAt,
            }));
          }
          // Rehydrate Set from array
          if (state && Array.isArray((state as any).collapsedFeatureIds)) {
            state.collapsedFeatureIds = new Set((state as any).collapsedFeatureIds);
          }

          // CRITICAL FIX: ensure live state matches current project after rehydration
          if (state?.currentProjectId && state.projectData?.[state.currentProjectId]) {
            const data = state.projectData[state.currentProjectId];
            if (data) {
              state.features = data.features;
              state.groups = data.groups;
              state.collapsedFeatureIds = data.collapsedFeatureIds;
            }
          }
        },
        migrate: (persistedState: unknown, version: number) => {
          if (version < 5) {
            // Migrate v4 to v5: wrap single-project data into multi-project structure
            const v4State = persistedState as any;
            if (v4State?.features && v4State?.groups) {
              // Carry forward as top-level live state (first switchProject call will save it properly)
              return {
                currentProjectId: null,
                projectData: {},
                features: v4State.features,
                groups: v4State.groups,
                collapsedFeatureIds: v4State.collapsedFeatureIds || [],
              };
            }
            return {
              currentProjectId: null,
              projectData: {},
            };
          }
          return persistedState as {
            currentProjectId: string | null;
            projectData: Record<string, {
              features: GanttFeature[];
              groups: GroupName[];
              collapsedFeatureIds: string[];
            }>;
          };
        },
      }
    ),
    { name: 'ConstructionStore' }
  )
);

// Export types for external use
export type { ConstructionState, ConstructionSelectors, FeatureId, GroupName };
