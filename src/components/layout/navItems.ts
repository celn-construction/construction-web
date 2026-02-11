export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/dashboard' },
  { id: 'timeline', label: 'Timeline', icon: 'Calendar', href: '/timeline' },
  { id: 'gantt', label: 'Gantt', icon: 'GanttChart', href: '/gantt' },
  { id: 'bryntum', label: 'Bryntum', icon: 'BarChart3', href: '/bryntum' },
  { id: 'projects', label: 'Projects', icon: 'LayoutGrid', href: '/projects' },
  { id: 'documents', label: 'Documents', icon: 'FileText', href: '/documents' },
  { id: 'tasks', label: 'Tasks', icon: 'Zap', href: '/tasks' },
  { id: 'reports', label: 'Reports', icon: 'Clipboard', href: '/reports' },
  { id: 'team', label: 'Team', icon: 'Users', href: '/team' },
];
