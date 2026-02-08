'use client';

// Re-export types
export type {
  GanttStatus,
  GanttFeature,
  GanttMarkerProps,
  Range,
  TimelineData,
  GanttContextProps,
} from './gantt/types';

// Re-export context exports for backwards compatibility
export { GanttProvider, useGanttDragging, useGanttScrollX, useGanttDropTarget } from './gantt/context';
export type { GanttProviderProps } from './gantt/context';

// Re-export all components
export {
  // Feature components
  GanttFeatureItem,
  GanttFeatureItemCard,
  GanttFeatureDragHelper,
  GanttStagingZone,

  // Header components
  GanttContentHeader,
  DailyHeader,
  MonthlyHeader,
  QuarterlyHeader,
  GanttHeader,

  // Sidebar components
  GanttSidebarItem,
  GanttSidebarHeader,
  GanttSidebarGroup,
  GanttSidebar,

  // Column components
  GanttColumn,
  GanttColumns,
  GanttAddFeatureHelper,

  // Marker components
  GanttMarker,
  GanttToday,
  GanttCreateMarkerTrigger,

  // Timeline components
  GanttTimeline,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttRowGrid,

  // DnD components
  GanttDropZoneIndicator,

  // Other components
  CustomScrollbar,
  GanttDroppableRow,
} from './gantt/components';

// Re-export all component types
export type {
  // Feature component types
  GanttFeatureItemProps,
  GanttFeatureItemCardProps,
  GanttFeatureDragHelperProps,
  GanttStagingZoneProps,

  // Header component types
  GanttContentHeaderProps,
  GanttMonthlyHeaderProps,
  GanttHeaderProps,

  // Sidebar component types
  GanttSidebarItemProps,
  GanttSidebarGroupProps,
  GanttSidebarProps,

  // Column component types
  GanttColumnProps,
  GanttColumnsProps,
  GanttAddFeatureHelperProps,

  // Marker component types
  GanttTodayProps,
  GanttCreateMarkerTriggerProps,

  // Timeline component types
  GanttTimelineProps,
  GanttFeatureListProps,
  GanttFeatureListGroupProps,
  GanttRowGridProps,

  // DnD component types
  GanttDropZoneIndicatorProps,

  // Other component types
  CustomScrollbarProps,
  GanttDroppableRowProps,
} from './gantt/components';
