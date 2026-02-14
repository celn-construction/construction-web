export interface NavItem {
  id: string;
  label: string;
  icon: string;
  segment: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', segment: 'dashboard' },
  { id: 'gantt', label: 'Gantt', icon: 'GanttChart', segment: 'gantt' },
  { id: 'documents', label: 'Documents', icon: 'FileText', segment: 'documents' },
  { id: 'tasks', label: 'Tasks', icon: 'Zap', segment: 'tasks' },
  { id: 'reports', label: 'Reports', icon: 'Clipboard', segment: 'reports' },
  { id: 'team', label: 'Team', icon: 'Users', segment: 'team' },
];

export function getNavHref(segment: string, slug: string | undefined): string {
  return slug ? `/projects/${slug}/${segment}` : `/${segment}`;
}
