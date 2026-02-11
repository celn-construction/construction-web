'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Home, LayoutGrid, Zap, Clipboard, FileText, Calendar, Users, GanttChart, BarChart3 } from 'lucide-react';
import { navItems } from './navItems';
import { LogoIcon } from '@/components/ui/Logo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'Calendar': return Calendar;
      case 'GanttChart': return GanttChart;
      case 'BarChart3': return BarChart3;
      case 'FileText': return FileText;
      case 'LayoutGrid': return LayoutGrid;
      case 'Zap': return Zap;
      case 'Clipboard': return Clipboard;
      case 'Users': return Users;
      default: return Home;
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 dark:bg-black/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-sidebar)] transform transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center font-bold text-sm">
              <LogoIcon size={18} />
            </div>
            <span className="font-medium text-sm text-[var(--text-primary)]">BuildTrack</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 p-4">
          {/* Navigate Section */}
          <div className="flex flex-col gap-1">
            <div className="px-3 mb-1 text-[10px] tracking-widest text-[var(--text-muted)] font-medium uppercase">
              Navigate
            </div>
            {navItems.slice(0, 5).map((item) => {
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
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--sidebar-indicator)]"
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
            {navItems.slice(5).map((item) => {
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
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--sidebar-indicator)]"
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
      </div>
    </>
  );
}
