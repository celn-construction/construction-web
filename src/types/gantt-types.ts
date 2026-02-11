// Minimal type definitions for document modal compatibility
// These types match the structure from the removed custom Gantt

export type GanttStatus = {
  id: string;
  name: string;
  color: string;
};

export type GanttFeature = {
  id: string;
  name: string;
  startAt?: Date;
  endAt?: Date;
  status: GanttStatus;
  group: string; // Required for construction tracking
  coverImage?: string;
  progress?: number;
  parentId?: string; // If set, this is a subtask
};

// Dependency types for Gantt task relationships
export type DependencyType = 'FS'; // Finish-to-Start (most common in construction)
// Future: 'SS' | 'FF' | 'SF'

export type GanttDependency = {
  id: string;
  sourceId: string; // source feature ID (predecessor)
  targetId: string; // target feature ID (successor)
  type: DependencyType; // 'FS' for now
};
