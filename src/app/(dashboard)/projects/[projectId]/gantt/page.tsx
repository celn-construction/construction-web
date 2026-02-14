import { Suspense } from 'react';
import BryntumGanttWrapper from '~/components/bryntum/BryntumGanttWrapper';
import { redirect } from 'next/navigation';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { api } from '~/trpc/server';

interface GanttPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function GanttPage({ params }: GanttPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const { projectId } = await params;

  // Verify project exists and user has access
  const project = await api.project.getById({ id: projectId });

  if (!project) {
    redirect('/projects');
  }

  // Track active project (direct DB update, not a tRPC mutation)
  const { db } = await import('~/server/db');
  await db.user.update({
    where: { id: session.user.id },
    data: { activeProjectId: projectId },
  });

  return (
    <div className="h-full w-full p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{project.name} - Gantt Chart</h1>
      </div>

      <div className="h-[calc(100%-4rem)]">
        <Suspense fallback={<div>Loading Gantt chart...</div>}>
          <BryntumGanttWrapper projectId={projectId} />
        </Suspense>
      </div>
    </div>
  );
}
