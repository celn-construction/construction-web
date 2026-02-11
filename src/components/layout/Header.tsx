'use client';

import { Search, Moon, Sun, ChevronRight, ChevronDown, Bell, Home, Calendar, FileText, LayoutGrid, Zap, Clipboard, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import UserMenu from './UserMenu';
import { useThemeStore } from '@/store/useThemeStore';
import { navItems } from './navItems';
import { api } from '@/trpc/react';
import { useCurrentProjectId, useSwitchProject } from '@/store/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const pathname = usePathname();

  // Project management
  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery(
    undefined,
    { retry: false }
  );
  const currentProjectId = useCurrentProjectId();
  const switchProject = useSwitchProject();

  // Auto-set first project on initial load
  useEffect(() => {
    if (!currentProjectId && projects.length > 0 && !projectsLoading) {
      switchProject(projects[0]!.id);
    }
  }, [currentProjectId, projects, projectsLoading, switchProject]);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'Calendar': return Calendar;
      case 'FileText': return FileText;
      case 'LayoutGrid': return LayoutGrid;
      case 'Zap': return Zap;
      case 'Clipboard': return Clipboard;
      case 'Users': return Users;
      default: return Home;
    }
  };

  const getCurrentPage = () => {
    return navItems.find(item => item.href === pathname) ?? navItems[0];
  };

  const currentPage = getCurrentPage();
  const CurrentIcon = getIcon(currentPage?.icon ?? 'Home');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: -4 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <header className="bg-[var(--bg-primary)] px-6 py-3 flex items-center justify-between border-b border-[var(--border-light)] transition-colors duration-150">
      {/* Left: Breadcrumb */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2"
      >
        <motion.div variants={item} className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
          <span className="font-medium">BuildTrack</span>
        </motion.div>
        <motion.div variants={item}>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </motion.div>

        {/* Project Switcher - Always render to prevent layout shift */}
        {projects.length > 0 && (
          <>
            <motion.div variants={item}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] text-sm font-medium"
                  disabled={projectsLoading}
                >
                  {projectsLoading ? (
                    <span className="text-[var(--text-muted)]">Loading...</span>
                  ) : (
                    currentProject?.name ?? 'Select Project'
                  )}
                  <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                {!projectsLoading && (
                  <DropdownMenuContent align="start">
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => switchProject(project.id)}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            project.id === currentProjectId
                              ? 'bg-[var(--status-green)]'
                              : 'bg-transparent'
                          }`}
                        />
                        {project.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            </motion.div>
            <motion.div variants={item}>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </motion.div>
          </>
        )}

        <motion.div variants={item} className="flex items-center gap-2">
          <CurrentIcon className="w-[18px] h-[18px] text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)] font-medium text-sm">{currentPage?.label ?? 'Home'}</span>
        </motion.div>
      </motion.div>

      {/* Center: Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="hidden md:flex items-center gap-3 bg-[var(--bg-input)] px-4 py-2 rounded-lg transition-all duration-150 hover:bg-[var(--bg-hover)] cursor-pointer group max-w-md w-full"
      >
        <Search className="w-[18px] h-[18px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors duration-150" />
        <span className="text-sm text-[var(--text-muted)] flex-1">Search...</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-light)] rounded">
            ⌘
          </kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-light)] rounded">
            K
          </kbd>
        </div>
      </motion.div>

      {/* Right: Actions */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2"
      >
        {/* Theme Toggle */}
        <motion.button
          variants={item}
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--bg-hover)] transition-all duration-150 cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' ? 0 : 180 }}
            transition={{ duration: 0.15 }}
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
            )}
          </motion.div>
        </motion.button>

        {/* Notification Bell */}
        <motion.button
          variants={item}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--bg-hover)] transition-all duration-150 cursor-pointer relative"
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
          {/* Optional notification indicator */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--status-amber)] rounded-full" />
        </motion.button>

        {/* User Menu */}
        <motion.div variants={item}>
          <UserMenu />
        </motion.div>
      </motion.div>
    </header>
  );
}
