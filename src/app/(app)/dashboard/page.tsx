'use client';

import dynamic from 'next/dynamic';
import { useSession } from '@/lib/auth-client';

const DashboardGantt = dynamic(
  () => import('@/components/dashboard/DashboardGantt'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full gap-4">
        <div className="w-64 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse">
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-t-lg" />
          <div className="p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
);

export default function DashboardPage() {
  const { data: session } = useSession();

  return <DashboardGantt />;
}
