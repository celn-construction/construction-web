'use client';

import dynamic from 'next/dynamic';
import { useSession } from '@/lib/auth-client';
import GanttLoadingAnimation from '@/components/dashboard/GanttLoadingAnimation';

const DashboardGantt = dynamic(
  () => import('@/components/dashboard/DashboardGantt'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
        <GanttLoadingAnimation />
      </div>
    )
  }
);

export default function DashboardPage() {
  const { data: session } = useSession();

  return <DashboardGantt />;
}
