'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { api } from '@/trpc/react';
import GanttLoadingAnimation from '@/components/dashboard/GanttLoadingAnimation';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

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
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery();

  // Auto-open dialog when no projects exist
  useEffect(() => {
    if (!projectsLoading && projects.length === 0) {
      setAddProjectOpen(true);
    }
  }, [projects, projectsLoading]);

  return (
    <>
      <DashboardGantt />
      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </>
  );
}
