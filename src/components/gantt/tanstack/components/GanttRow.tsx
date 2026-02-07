/**
 * Single virtualized row component for the Gantt chart
 * Handles both group header rows and feature rows
 */

import { GanttTimelineBar } from '../GanttTimelineBar';
import type { RowItem } from '../hooks/useRowBuilder';
import type { GanttFeature } from '@/components/ui/gantt/types/core.types';

interface GanttRowProps {
  row: RowItem;
  rowHeight: number;
  leftPanelWidth: number;
  dateToX: (date: Date) => number;
  xToDate: (x: number) => Date;
  onFeatureDragEnd: (id: string, newStart: Date, newEnd: Date) => void;
  featureMap: Map<string, GanttFeature>;
}

export function GanttRow({
  row,
  rowHeight,
  leftPanelWidth,
  dateToX,
  xToDate,
  onFeatureDragEnd,
  featureMap,
}: GanttRowProps) {
  if (row.type === 'group') {
    return (
      <>
        {/* Left panel: Group header */}
        <div
          className="absolute bg-gray-100 border-b border-gray-300 flex items-center px-4 font-semibold text-sm"
          style={{
            left: 0,
            width: leftPanelWidth,
            height: rowHeight,
          }}
        >
          {row.groupName}
        </div>

        {/* Right panel: Empty timeline area for group */}
        <div
          className="absolute border-b border-gray-300"
          style={{
            left: leftPanelWidth,
            right: 0,
            height: rowHeight,
          }}
        />
      </>
    );
  }

  // Feature row
  const feature = row.feature;
  if (!feature) return null;

  // Get the feature from the map
  const ganttFeature = featureMap.get(feature.id);
  if (!ganttFeature) return null;

  return (
    <>
      {/* Left panel: Feature name */}
      <div
        className="absolute border-b border-gray-200 flex items-center px-6 text-sm truncate"
        style={{
          left: 0,
          width: leftPanelWidth,
          height: rowHeight,
        }}
        title={feature.name}
      >
        {feature.name}
      </div>

      {/* Right panel: Timeline with bar */}
      <div
        className="absolute border-b border-gray-200"
        style={{
          left: leftPanelWidth,
          right: 0,
          height: rowHeight,
        }}
      >
        <GanttTimelineBar
          feature={ganttFeature}
          dateToX={dateToX}
          xToDate={xToDate}
          rowHeight={rowHeight}
          onDragEnd={onFeatureDragEnd}
        />
      </div>
    </>
  );
}
