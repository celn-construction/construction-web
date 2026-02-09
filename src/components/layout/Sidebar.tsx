'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Zap, Clipboard, GanttChart, FileText, Calendar } from 'lucide-react';
import { navItems } from './navItems';

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

  return (
    <aside className="h-screen w-14 bg-[var(--bg-sidebar)] flex flex-col items-center py-3 gap-1 sticky top-0 transition-colors duration-150">
      {navItems.map((item) => {
        const Icon = getIcon(item.icon);
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              isActive
                ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
          </Link>
        );
      })}
    </aside>
  );
}
