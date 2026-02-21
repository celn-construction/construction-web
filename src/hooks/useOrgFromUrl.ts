'use client';

import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';

export function useOrgFromUrl() {
  const params = useParams<{ orgSlug?: string }>();
  const orgSlug = params.orgSlug ?? '';
  const { data: organizations = [] } = api.organization.list.useQuery(undefined, { retry: false });
  const currentOrg = organizations.find((o) => o.slug === orgSlug);
  const activeOrganizationId = currentOrg?.id ?? '';

  return { orgSlug, activeOrganizationId, currentOrg };
}
