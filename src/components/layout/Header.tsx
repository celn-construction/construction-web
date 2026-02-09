'use client';

import { Search, Moon, Sun, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import { useThemeStore } from '@/store/useThemeStore';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/timeline') return 'Timeline';
    if (pathname === '/documents') return 'Documents';
    if (pathname === '/projects') return 'Projects';
    if (pathname === '/tasks') return 'Tasks';
    if (pathname === '/reports') return 'Reports';
    return 'BuildTrack';
  };

  return (
    <header className="bg-[var(--bg-primary)] px-6 py-2.5 flex items-center justify-between border-b border-[var(--border-light)] transition-colors duration-150">
      <div className="flex items-center gap-4">
        <span className="text-[var(--text-primary)] font-medium">{getPageTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
          )}
        </button>
        <button className="flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer">
          <Search className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
        </button>
        <UserMenu />
        <button className="bg-[var(--accent-primary)] text-[var(--bg-primary)] px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
          <Plus className="w-4 h-4" />
          Add task
        </button>
      </div>
    </header>
  );
}
