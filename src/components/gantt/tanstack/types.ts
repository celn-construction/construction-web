export type ZoomLevel = "month" | "week" | "day";

export interface TimelineColumn {
  key: string;
  label: string;
  date: Date;
}

export interface ZoomConfig {
  columnWidth: number;
  unit: ZoomLevel;
  formatLabel: (date: Date) => string;
}
