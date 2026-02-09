'use client';

import { Calendar } from 'lucide-react';
import Link from 'next/link';
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
  type GanttFeature as KiboFeature,
} from '@/components/kibo-ui/gantt';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
  useFeatureActions,
  useGroups,
} from '@/store/hooks';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { grouped, flatList: allFeatures } = useGroupedFeaturesWithRows();
  const { move: moveFeature } = useFeatureActions();
  const groups = useGroups();

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

  // Move handler
  const handleMove = (id: string, startDate: Date, endDate: Date | null) => {
    moveFeature(id, startDate, endDate ?? startDate);
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col h-full bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-card)] transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-[var(--text-secondary)]" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Timeline
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500 dark:text-[var(--text-secondary)] bg-gray-100 dark:bg-[var(--bg-input)] px-3 py-1.5 rounded-full">
              {kiboFeatures.length} tasks
            </span>
            <Link
              href="/gantt"
              className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Advanced View
            </Link>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="flex-1 overflow-hidden">
          <GanttProvider range="daily" zoom={100}>
            <GanttSidebar>
              {groups.map((groupName) => (
                <GanttSidebarGroup key={groupName} name={groupName}>
                  {kiboGrouped[groupName]?.map((feature) => (
                    <GanttSidebarItem key={feature.id} feature={feature} />
                  ))}
                </GanttSidebarGroup>
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
              <GanttToday />
            </GanttTimeline>
          </GanttProvider>
        </div>
      </div>
    </LayoutWrapper>
  );
}
