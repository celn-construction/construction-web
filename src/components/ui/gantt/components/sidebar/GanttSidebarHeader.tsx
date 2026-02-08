'use client';

import type { FC } from 'react';

export const GanttSidebarHeader: FC = () => (
  <div
    className="sticky top-0 z-10 flex shrink-0 items-end border-gray-200 dark:border-[var(--border-color)] border-b bg-white dark:bg-[var(--bg-card)] font-medium text-gray-600 dark:text-[var(--text-secondary)] text-xs transition-colors duration-300"
    style={{ height: 'var(--gantt-header-height)' }}
  >
    <div className="flex flex-1 items-end p-2.5">
      <p className="flex-1 truncate text-left">Issues</p>
    </div>
  </div>
);
