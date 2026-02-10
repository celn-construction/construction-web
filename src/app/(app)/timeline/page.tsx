"use client";

import dynamic from 'next/dynamic';

const TimelineCalendar = dynamic(
  () => import('@/components/timeline/TimelineCalendar'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full gap-4">
        <div className="w-48 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse">
          <div className="p-4 space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse">
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-t-lg" />
          <div className="grid grid-cols-7 gap-px p-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
);

export default function TimelinePage() {
  return <TimelineCalendar />;
}
