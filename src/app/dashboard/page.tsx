'use client';

import { Calendar } from 'lucide-react';
import Link from 'next/link';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { useSession } from '@/lib/auth-client';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
} from '@/store/hooks';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { flatList: allFeaturesWithIndex } = useGroupedFeaturesWithRows();

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
              {allFeaturesWithIndex.length} tasks
            </span>
            <Link
              href="/dashboard/custom-gantt"
              className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              View Gantt Chart
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
          <div className="text-center max-w-md">
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Project Timeline Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              View and manage your project timeline with the interactive Gantt chart.
            </p>
            <Link
              href="/dashboard/custom-gantt"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Open Gantt Chart
            </Link>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
