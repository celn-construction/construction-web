'use client';

import { DraftingCompass } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--blueprint-line)] bg-white dark:bg-[var(--bg-card)] transition-colors duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--blueprint-accent)]/10 border border-[var(--blueprint-accent)]/30">
              <DraftingCompass className="w-5 h-5 text-[var(--blueprint-accent)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold tracking-wider uppercase font-[family-name:var(--font-mono-blueprint)] text-gray-900 dark:text-white">
                Project Timeline
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-[var(--text-muted)] font-[family-name:var(--font-mono-blueprint)]">
                REV {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium font-[family-name:var(--font-mono-blueprint)] text-[var(--blueprint-accent)] bg-[var(--blueprint-accent)]/10 px-3 py-1.5 rounded border border-[var(--blueprint-accent)]/30">
              {kiboFeatures.length} TASKS
            </span>
            <Link
              href="/gantt"
              className="px-3 py-1.5 text-xs font-medium font-[family-name:var(--font-mono-blueprint)] text-[var(--blueprint-safety)] hover:text-[var(--blueprint-safety)] border border-[var(--blueprint-safety)]/40 rounded hover:bg-[var(--blueprint-safety)]/10 transition-colors"
            >
              CUSTOM VIEW
            </Link>
          </div>
        </motion.div>

        {/* Gantt Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 overflow-hidden"
        >
          <GanttProvider range="daily" zoom={100}>
            <GanttSidebar>
              {groups.map((groupName, groupIndex) => (
                <motion.div
                  key={groupName}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + groupIndex * 0.05 }}
                >
                  <GanttSidebarGroup name={groupName}>
                    {kiboGrouped[groupName]?.map((feature) => (
                      <GanttSidebarItem key={feature.id} feature={feature} />
                    ))}
                  </GanttSidebarGroup>
                </motion.div>
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
        </motion.div>
      </div>
    </LayoutWrapper>
  );
}
