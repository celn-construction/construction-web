'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useLoading } from '@/components/providers/LoadingProvider';

export function useProjectSwitcher(activeOrganizationId: string, orgSlug: string) {
  const params = useParams<{ projectSlug?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { showLoading } = useLoading();

  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery(
    { organizationId: activeOrganizationId },
    { retry: false, enabled: !!activeOrganizationId }
  );

  const { data: activeProject } = api.project.getActive.useQuery(
    { organizationId: activeOrganizationId },
    { retry: false, enabled: !!activeOrganizationId }
  );

  const currentProject = projects.find((p) => p.slug === params?.projectSlug);

  // Effective project: prefer URL-scoped project (project routes), otherwise fall
  // back to the user's persisted active project so the header chip and sidebar
  // nav links still resolve on org-root pages (e.g. /[orgSlug]/projects).
  const effectiveProject =
    currentProject ?? projects.find((p) => p.id === activeProject?.id) ?? null;

  const switchProject = (projectSlug: string) => {
    const pathParts = pathname.split('/');
    const currentSegment =
      pathParts.length > 0 && pathParts.includes('projects')
        ? pathParts[pathParts.length - 1]
        : 'gantt';
    showLoading('Switching projects');
    router.push(`/${orgSlug}/projects/${projectSlug}/${currentSegment}`);
  };

  return {
    projects,
    currentProject,
    effectiveProject,
    effectiveProjectSlug: effectiveProject?.slug ?? null,
    projectsLoading,
    switchProject,
  };
}
