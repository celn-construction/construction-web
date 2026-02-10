'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Zap, Clipboard, GanttChart, FileText, Calendar } from 'lucide-react';
import { navItems } from './navItems';
import { LogoIcon } from '@/components/ui/Logo';

export default function Sidebar() {
  const pathname = usePathname();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'Calendar': return Calendar;
      case 'FileText': return FileText;
      case 'LayoutGrid': return LayoutGrid;
      case 'Zap': return Zap;
      case 'Clipboard': return Clipboard;
      case 'GanttChart': return GanttChart;
      default: return Home;
    }
  };

  const navigateItems = navItems.slice(0, 3);
  const workspaceItems = navItems.slice(3);

  return (
    <aside className="h-screen w-52 bg-[var(--bg-sidebar)] flex flex-col sticky top-0 transition-colors duration-150 sidebar-depth">
      {/* Branding Area */}
      <div className="px-4 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="w-8 h-8 rounded-md bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center font-bold text-sm">
          <LogoIcon size={18} />
        </div>
        <span className="font-medium text-sm text-[var(--text-primary)]">BuildTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-6 p-4 flex-1">
        {/* Navigate Section */}
        <div className="flex flex-col gap-1">
          <div className="px-3 mb-1 text-[10px] tracking-widest text-[var(--text-muted)] font-medium uppercase">
            Navigate
          </div>
          {navigateItems.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--sidebar-active-bg)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--sidebar-indicator)]"
                    aria-hidden="true"
                  />
                )}
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Workspace Section */}
        <div className="flex flex-col gap-1">
          <div className="px-3 mb-1 text-[10px] tracking-widest text-[var(--text-muted)] font-medium uppercase">
            Workspace
          </div>
          {workspaceItems.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--sidebar-active-bg)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--sidebar-indicator)]"
                    aria-hidden="true"
                  />
                )}
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
