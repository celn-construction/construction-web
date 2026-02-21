export interface NavItem {
  id: string;
  label: string;
  icon: string;
  segment: string;
}

// Organization-level navigation (always available)
export const orgNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'Home', segment: '' },
  { id: 'team', label: 'Team', icon: 'Users', segment: 'team' },
];

// Project-level navigation (requires a selected project)
export const projectNavItems: NavItem[] = [
  { id: 'gantt', label: 'Gantt', icon: 'GanttChart', segment: 'gantt' },
  { id: 'files', label: 'Files', icon: 'FolderOpen', segment: 'files' },
  { id: 'document-explorer', label: 'Document Explorer', icon: 'FileSearch', segment: 'document-explorer' },
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

