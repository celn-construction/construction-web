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

  const currentProject = projects.find((p) => p.slug === params?.projectSlug);

  const switchProject = (projectSlug: string) => {
    const pathParts = pathname.split('/');
    const currentSegment =
      pathParts.length > 0 && pathParts.includes('projects')
        ? pathParts[pathParts.length - 1]
        : 'gantt';
    showLoading('Switching projects');
    router.push(`/${orgSlug}/projects/${projectSlug}/${currentSegment}`);
  };

  return { projects, currentProject, projectsLoading, switchProject };
}
