'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { useSession } from '@/lib/auth-client';
import {
  GanttProvider,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  GanttRowGrid,
  GanttDropZoneIndicator,
  type GanttFeature,
} from '@/components/ui/gantt';
import GanttTaskColumn from '@/components/gantt/GanttTaskColumn';
import TimelineBarPopover from '@/components/gantt/TimelineBarPopover';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
  useFeatureActions,
  useGroups,
  useStatuses,
} from '@/store/hooks';

// Memoized feature row component to prevent unnecessary re-renders
interface GanttFeatureRowProps {
  feature: GanttFeature;
  rowIndex: number;
  totalRows: number;
  group: string;
  onMove: (id: string, startAt: Date, endAt: Date | null, targetRow?: number) => void;
  onCoverImageChange: (featureId: string, coverImage: string | undefined) => void;
  onDelete: (featureId: string) => void;
}

const GanttFeatureRow = memo(function GanttFeatureRow({
  feature,
  rowIndex,
  totalRows,
  group,
  onMove,
  onCoverImageChange,
  onDelete,
}: GanttFeatureRowProps) {
  const popoverContent = useMemo(
    () => <TimelineBarPopover feature={feature} group={group} onCoverImageChange={onCoverImageChange} onDelete={onDelete} />,
    [feature, group, onCoverImageChange, onDelete]
  );

  return (
    <div className="flex relative overflow-visible">
      <GanttFeatureItem
        onMove={onMove}
        rowIndex={rowIndex}
        totalRows={totalRows}
        groupName={group}
        popoverContent={popoverContent}
        {...feature}
      />
    </div>
  );
});

export default function CustomGanttPage() {
  // Auth session for user info
  const { data: session } = useSession();

  // Zustand state - features, groups, statuses from store
  const { grouped: groupedFeatures, flatList: allFeaturesWithIndex, totalRows } = useGroupedFeaturesWithRows();
  const { add: addFeature, move: moveFeature, update: updateFeature, remove: removeFeature } = useFeatureActions();
  const groups = useGroups();
  const statuses = useStatuses();

  // Local UI state - stays as useState
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Feature movement handler with drag-to-move support
  const handleMove = useCallback(
    (id: string, startAt: Date, endAt: Date | null, targetRow?: number) => {
      moveFeature(id, startAt, endAt ?? startAt);
    },
    [moveFeature]
  );

  // Handle cover image updates
  const handleCoverImageChange = useCallback(
    (featureId: string, coverImage: string | undefined) => {
      updateFeature(featureId, { coverImage });
    },
    [updateFeature]
  );

  // Handle feature deletion
  const handleDelete = useCallback(
    (featureId: string) => {
      removeFeature(featureId);
    },
    [removeFeature]
  );

  return (
    <LayoutWrapper>
      <div className="space-y-6 mb-8">
        {/* Header with greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {greeting}, {session?.user?.name || 'there'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Custom Gantt Chart View with Phase 1-3 Improvements
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Gantt Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header with title and fullscreen toggle */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Project Timeline
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {totalRows} {totalRows === 1 ? 'task' : 'tasks'} across {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>

          {/* Gantt Chart Container */}
          <div className={isFullscreen ? 'h-screen' : 'h-[600px]'}>
            <GanttProvider>
              <div className="flex h-full overflow-hidden">
                {/* Left sidebar: Task names */}
                <GanttTaskColumn
                  groupedFeatures={groupedFeatures}
                />

                {/* Right timeline: Gantt bars */}
                <div className="flex-1 overflow-auto relative">
                  <GanttTimeline>
                    <GanttHeader />
                    <div className="relative">
                      <GanttRowGrid totalRows={totalRows} />
                      <GanttToday />
                      <GanttFeatureList>
                        {groups.map((groupName) => (
                          <GanttFeatureListGroup key={groupName}>
                            {groupedFeatures[groupName]?.map((feature) => {
                              const featureData = allFeaturesWithIndex.find((f) => f.feature.id === feature.id);
                              if (!featureData) return null;

                              return (
                                <GanttFeatureRow
                                  key={feature.id}
                                  feature={feature}
                                  rowIndex={featureData.rowIndex}
                                  totalRows={totalRows}
                                  group={groupName}
                                  onMove={handleMove}
                                  onCoverImageChange={handleCoverImageChange}
                                  onDelete={handleDelete}
                                />
                              );
                            })}
                          </GanttFeatureListGroup>
                        ))}
                      </GanttFeatureList>
                      <GanttDropZoneIndicator />
                    </div>
                  </GanttTimeline>
                </div>
              </div>
            </GanttProvider>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
