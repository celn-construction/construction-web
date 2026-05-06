export type NavSection = 'navigation' | 'workspace';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  segment: string;
  section: NavSection;
}

export interface NavSectionDef {
  id: NavSection;
  label: string;
}

export const SIDEBAR_SECTIONS: NavSectionDef[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'workspace', label: 'Workspace' },
];

// Organization-level navigation (no longer used)
export const orgNavItems: NavItem[] = [];

// Project-level navigation (requires a selected project)
export const projectNavItems: NavItem[] = [
  { id: 'gantt', label: 'Gantt', icon: 'ChartBar', segment: 'gantt', section: 'navigation' },
  { id: 'files', label: 'File Tree', icon: 'FolderSimple', segment: 'files', section: 'navigation' },
  { id: 'document-explorer', label: 'Document Explorer', icon: 'FileMagnifyingGlass', segment: 'document-explorer', section: 'navigation' },
  { id: 'reviews', label: 'Review Queue', icon: 'SealCheck', segment: 'reviews', section: 'navigation' },
  { id: 'team', label: 'Team', icon: 'UsersThree', segment: 'team', section: 'workspace' },
  { id: 'project-settings', label: 'Project Settings', icon: 'GearSix', segment: 'settings', section: 'workspace' },
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
