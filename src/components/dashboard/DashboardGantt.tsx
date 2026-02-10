'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Import Kibo UI Gantt components
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttToday,
  computeSubRows,
  type GanttFeature as KiboFeature,
} from '@/components/kibo-ui/gantt';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
  useFeatureActions,
  useGroups,
} from '@/store/hooks';

export default function DashboardGantt() {
  const { grouped, flatList: allFeatures } = useGroupedFeaturesWithRows();
  const { move: moveFeature } = useFeatureActions();
  const groups = useGroups();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  // Adapter: Filter out features without dates and map to Kibo's type
  const kiboFeatures: KiboFeature[] = useMemo(
    () =>
      allFeatures
        .filter((item) => item.feature.startAt && item.feature.endAt)
        .map((item) => ({
          id: item.feature.id,
          name: item.feature.name,
          startAt: item.feature.startAt!,
          endAt: item.feature.endAt!,
          status: item.feature.status,
        })),
    [allFeatures]
  );

  // Group Kibo features by group
  const kiboGrouped = useMemo(() => {
    const result: Record<string, KiboFeature[]> = {};
    for (const groupName of groups) {
      result[groupName] = kiboFeatures.filter((f) => {
        const originalFeature = allFeatures.find((item) => item.feature.id === f.id);
        return originalFeature?.feature.group === groupName;
      });
    }
    return result;
  }, [groups, kiboFeatures, allFeatures]);

  // Compute sub-row counts for each group to ensure sidebar/timeline height sync
  const subRowCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const groupName of groups) {
      const groupFeatures = kiboGrouped[groupName] || [];
      counts[groupName] = computeSubRows(groupFeatures);
    }
    return counts;
  }, [groups, kiboGrouped]);

  // Move handler
  const handleMove = (id: string, startDate: Date, endDate: Date | null) => {
    moveFeature(id, startDate, endDate ?? startDate);
  };

  // Select handler
  const handleSelectItem = (id: string) => {
    setSelectedFeatureId(id);
  };

  // Get selected feature name
  const selectedFeature = kiboFeatures.find((f) => f.id === selectedFeatureId);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <div className="flex-1 overflow-hidden">
        <GanttProvider range="daily" zoom={100}>
          <GanttSidebar>
            {groups.map((groupName) => (
              <div key={groupName}>
                <GanttSidebarGroup name={groupName} subRowCount={subRowCounts[groupName]}>
                  {kiboGrouped[groupName]?.map((feature) => (
                    <GanttSidebarItem
                      key={feature.id}
                      feature={feature}
                    />
                  ))}
                </GanttSidebarGroup>
              </div>
            ))}
          </GanttSidebar>

          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              {groups.map((groupName) => (
                <GanttFeatureListGroup key={groupName}>
                  <GanttFeatureRow
                    features={kiboGrouped[groupName] || []}
                    onMove={handleMove}
                    onSelectItem={handleSelectItem}
                  />
                </GanttFeatureListGroup>
              ))}
            </GanttFeatureList>
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      </div>

      <Dialog open={!!selectedFeatureId} onOpenChange={(open) => !open && setSelectedFeatureId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFeature?.name}</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
