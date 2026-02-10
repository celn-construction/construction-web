'use client';

import { useMemo } from 'react';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { useSession } from '@/lib/auth-client';

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
  computeFeaturePositionMap,
  type GanttFeature as KiboFeature,
} from '@/components/kibo-ui/gantt';
import { GanttDependencyArrows } from '@/components/kibo-ui/gantt/GanttDependencyArrows';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
  useFeatureActions,
  useGroups,
  useDependencies,
} from '@/store/hooks';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { grouped, flatList: allFeatures } = useGroupedFeaturesWithRows();
  const { move: moveFeature } = useFeatureActions();
  const groups = useGroups();
  const dependencies = useDependencies();

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

  // Create feature map for dependency arrows
  const featureMap = useMemo(() => {
    const map = new Map();
    for (const f of kiboFeatures) map.set(f.id, f);
    return map;
  }, [kiboFeatures]);

  // Compute feature position map for dependency arrows
  const positionMap = useMemo(
    () => computeFeaturePositionMap(groups, kiboGrouped),
    [groups, kiboGrouped]
  );

  // Move handler
  const handleMove = (id: string, startDate: Date, endDate: Date | null) => {
    moveFeature(id, startDate, endDate ?? startDate);
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col h-full bg-[var(--bg-primary)]">
        <div className="flex-1 overflow-hidden">
          <GanttProvider range="daily" zoom={100}>
            <GanttSidebar>
              {groups.map((groupName) => (
                <div key={groupName}>
                  <GanttSidebarGroup name={groupName} subRowCount={subRowCounts[groupName]}>
                    {kiboGrouped[groupName]?.map((feature) => (
                      <GanttSidebarItem key={feature.id} feature={feature} />
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
                    />
                  </GanttFeatureListGroup>
                ))}
              </GanttFeatureList>
              <GanttDependencyArrows
                dependencies={dependencies}
                features={featureMap}
                positionMap={positionMap}
                groups={groups}
                subRowCounts={subRowCounts}
              />
              <GanttToday />
            </GanttTimeline>
          </GanttProvider>
        </div>
      </div>
    </LayoutWrapper>
  );
}
