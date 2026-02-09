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
  startAt?: Date | null;
  endAt?: Date | null;
  status: GanttStatus;
  group?: string;
  coverImage?: string;
  progress?: number;
};
