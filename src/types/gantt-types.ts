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
