'use client';

import { Search, Moon, Sun, ChevronDown, Bell, Users, Plus, Building2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import UserMenu from './UserMenu';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/trpc/react';
import { useCurrentProjectId, useSwitchProject } from '@/store/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

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
      {/* Left: Project Switcher */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2"
      >
        {/* Project Switcher */}
        <motion.div variants={item}>
          <DropdownMenu open={projectMenuOpen} onOpenChange={setProjectMenuOpen}>
            <DropdownMenuTrigger
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-color)] transition-all duration-150 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              disabled={projectsLoading}
            >
              <div className="w-7 h-7 rounded-md bg-[var(--accent-warm)] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] leading-none">Project</span>
                {projectsLoading ? (
                  <div className="h-4 w-24 bg-[var(--bg-hover)] rounded animate-pulse" />
                ) : (
                  <span className="text-[var(--text-primary)] truncate max-w-[160px] leading-tight">
                    {projects.length === 0 ? 'No Projects' : (currentProject?.name ?? 'Select Project')}
                  </span>
                )}
              </div>
              <motion.div animate={{ rotate: projectMenuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px] p-2" sideOffset={8}>
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Switch Project</span>
              </div>
              {projects.map((project) => {
                const isActive = project.id === currentProjectId;
                return (
                  <DropdownMenuItem key={project.id} onClick={() => switchProject(project.id)}
                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg mb-0.5 ${isActive ? 'bg-[var(--accent-subtle)]' : ''}`}>
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      isActive ? 'bg-[var(--accent-warm)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`text-sm truncate ${isActive ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-primary)]'}`}>
                        {project.name}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] capitalize">{project.status}</span>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[var(--accent-warm)] flex-shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              {projects.length > 0 && <DropdownMenuSeparator className="my-2" />}
              <DropdownMenuItem onClick={() => setAddProjectOpen(true)} className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg">
                <div className="w-8 h-8 rounded-md border border-dashed border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">New Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Add Project Dialog */}
      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </header>
  );
}
