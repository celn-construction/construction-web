'use client';

import { useShallow } from 'zustand/shallow';
import { useConstructionStore } from '../useConstructionStore';
import type { GanttFeature } from '@/types/gantt-types';

type FeatureId = string;
type GroupName = string;

// Return type for useFeatureActions
interface FeatureActions {
  add: (feature: GanttFeature) => void;
  update: (id: FeatureId, updates: Partial<GanttFeature>) => void;
  remove: (id: FeatureId) => void;
  move: (id: FeatureId, startAt: Date, endAt: Date) => void;
  updateMultiple: (updates: Array<{ id: FeatureId; changes: Partial<GanttFeature> }>) => void;
  reorderGroup: (groupName: GroupName, featureIds: FeatureId[]) => void;
  initialize: (features: GanttFeature[]) => void;
  addSubtask: (parentId: FeatureId, subtask: GanttFeature) => void;
  toggleCollapse: (featureId: FeatureId) => void;
}

/**
 * Hook to get all feature actions
 * Actions are stable references and don't cause re-renders
 */
export function useFeatureActions(): FeatureActions {
  return useConstructionStore(
    useShallow((state) => ({
      add: state.addFeature,
      update: state.updateFeature,
      remove: state.removeFeature,
      move: state.moveFeature,
      updateMultiple: state.updateMultipleFeatures,
      reorderGroup: state.reorderGroup,
      initialize: state.initializeFeatures,
      addSubtask: state.addSubtask,
      toggleCollapse: state.toggleFeatureCollapse,
    }))
  );
}

/**
 * Hook to get single add action
 */
export function useAddFeature() {
  return useConstructionStore((state) => state.addFeature);
}

/**
 * Hook to get single update action
 */
export function useUpdateFeature() {
  return useConstructionStore((state) => state.updateFeature);
}

/**
 * Hook to get single remove action
 */
export function useRemoveFeature() {
  return useConstructionStore((state) => state.removeFeature);
}

/**
 * Hook to get single move action
 */
export function useMoveFeature() {
  return useConstructionStore((state) => state.moveFeature);
}

/**
 * Hook to get add subtask action
 */
export function useAddSubtask() {
  return useConstructionStore((state) => state.addSubtask);
}

/**
 * Hook to get toggle collapse action
 */
export function useToggleFeatureCollapse() {
  return useConstructionStore((state) => state.toggleFeatureCollapse);
}
