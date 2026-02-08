'use client';

import { useMemo, useCallback } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import LayoutWrapper from '@/components/layout/LayoutWrapper';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
  useFeatureActions,
  useGroups,
} from '@/store/hooks';

// Dynamic import to avoid SSR issues with Frappe Gantt
const FrappeGanttChart = dynamic(
  () => import('@/components/gantt/FrappeGanttChart'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] rounded-lg border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-card)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading Gantt Chart...</span>
        </div>
      </div>
    ),
  }
);

export default function FrappeGanttPage() {
  const { flatList: allFeaturesWithIndex } = useGroupedFeaturesWithRows();
  const { update: updateFeature } = useFeatureActions();
  const groups = useGroups();

  // Transform features to Frappe Gantt format
  const ganttTasks = useMemo(() => {
    return allFeaturesWithIndex.map((item) => {
      const feature = item.feature;
      const startDate = feature.startAt ? new Date(feature.startAt) : new Date();
      const endDate = feature.endAt ? new Date(feature.endAt) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        id: feature.id,
        name: feature.name,
        start: startDate.toISOString().slice(0, 10), // 'YYYY-MM-DD'
        end: endDate.toISOString().slice(0, 10),
        progress: (feature.progress ?? 0) * 100,
        featureId: feature.id,
        group: feature.group ?? '',
        description: feature.name, // Could be enhanced with more details
      };
    });
  }, [allFeaturesWithIndex]);

  // Handle moving a task to a different group
  const handleGroupChange = useCallback((featureId: string, newGroup: string) => {
    updateFeature(featureId, { group: newGroup as typeof groups[number] });
    toast.success(`Moved task to ${newGroup}`);
  }, [updateFeature, groups]);

  // Handle task updates from Gantt
  const handleTaskUpdate = useCallback((task: { featureId: string; start: Date; end: Date }) => {
    const feature = allFeaturesWithIndex.find(f => f.feature.id === task.featureId);
    if (feature) {
      updateFeature(task.featureId, {
        startAt: task.start,
        endAt: task.end,
      });
    }
  }, [allFeaturesWithIndex, updateFeature]);

  // Handle progress changes from Gantt
  const handleProgressChange = useCallback((featureId: string, progress: number) => {
    updateFeature(featureId, {
      progress: progress / 100, // Convert from 0-100 to 0-1
    });
  }, [updateFeature]);

  return (
    <LayoutWrapper>
      <div className="flex flex-col h-full bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-card)] transition-colors duration-300">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-500 dark:text-[var(--text-secondary)] hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div className="w-px h-6 bg-gray-200 dark:bg-[var(--border-color)]" />
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-[var(--text-secondary)]" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Frappe Gantt
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500 dark:text-[var(--text-secondary)] bg-gray-100 dark:bg-[var(--bg-input)] px-3 py-1.5 rounded-full">
              {allFeaturesWithIndex.length} tasks
            </span>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="flex-1 p-4 overflow-hidden">
          <FrappeGanttChart
            tasks={ganttTasks}
            groups={groups}
            onTaskUpdate={handleTaskUpdate}
            onProgressChange={handleProgressChange}
            onGroupChange={handleGroupChange}
          />
        </div>
      </div>
    </LayoutWrapper>
  );
}
