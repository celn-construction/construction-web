export interface NavItem {
  id: string;
  label: string;
  icon: string;
  segment: string;
}

// Organization-level navigation (no longer used)
export const orgNavItems: NavItem[] = [];

// Project-level navigation (requires a selected project)
export const projectNavItems: NavItem[] = [
  { id: 'gantt', label: 'Gantt', icon: 'BarChart2', segment: 'gantt' },
  { id: 'files', label: 'File Tree', icon: 'Folder', segment: 'files' },
  { id: 'document-explorer', label: 'Document Explorer', icon: 'FileSearch', segment: 'document-explorer' },
  { id: 'team', label: 'Team', icon: 'Users', segment: 'team' },
];

// Helper to build org-level URLs
export function getOrgNavHref(segment: string, orgSlug: string): string {
  return segment ? `/${orgSlug}/${segment}` : `/${orgSlug}`;
}

// Helper to build project-level URLs
export function getProjectNavHref(
  segment: string,
  orgSlug: string | undefined,
  projectSlug: string | undefined
): string {
  if (!orgSlug || !projectSlug) {
    return '#'; // Disabled state
  }
  return `/${orgSlug}/projects/${projectSlug}/${segment}`;
}

