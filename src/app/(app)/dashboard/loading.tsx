'use client';

import GanttLoadingAnimation from '@/components/dashboard/GanttLoadingAnimation';

export default function DashboardLoading() {
  return (
    <div className="h-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
      <GanttLoadingAnimation />
    </div>
  );
}
