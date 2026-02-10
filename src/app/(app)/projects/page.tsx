'use client';

import { LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import ProjectsTree from '@/components/projects/ProjectsTree';
import { useGroupedFeaturesWithRows, useGroups } from '@/store/hooks/useGanttFeatures';

export default function ProjectsPage() {
  const groups = useGroups();
  const { flatList } = useGroupedFeaturesWithRows();

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)]">
      {/* Header */}
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-6 py-4 border-b border-[var(--blueprint-line)] bg-white dark:bg-[var(--bg-card)] transition-colors duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--blueprint-accent)]/10 border border-[var(--blueprint-accent)]/30">
            <LayoutGrid className="w-5 h-5 text-[var(--blueprint-accent)]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-wider uppercase font-[family-name:var(--font-mono-blueprint)] text-gray-900 dark:text-white">
              Construction Phases
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-[var(--text-muted)] font-[family-name:var(--font-mono-blueprint)]">
              {groups.length} PHASES • {flatList.length} TASKS
            </p>
          </div>
        </div>
      </motion.div>

      {/* Projects Tree */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 overflow-auto p-6"
      >
        <ProjectsTree />
      </motion.div>
    </div>
  );
}
