'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import ProjectsTree, { type Selection } from '@/components/projects/ProjectsTree';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';
import { useGroupedFeaturesWithRows, useGroups } from '@/store/hooks/useGanttFeatures';

export default function ProjectsPage() {
  const groups = useGroups();
  const { flatList } = useGroupedFeaturesWithRows();
  const [selection, setSelection] = useState<Selection | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const SIDEBAR_MIN = 200;
  const SIDEBAR_MAX = 600;

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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

      {/* Split View: Tree + Detail Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 flex overflow-hidden"
      >
        {/* Tree Pane - hidden on mobile when item selected */}
        <div
          className={`w-full lg:shrink-0 overflow-auto p-6 ${
            selection ? 'hidden lg:block' : 'block'
          } max-lg:!w-full`}
          style={{ width: sidebarWidth }}
        >
          <ProjectsTree selectedNodeId={selection?.nodeId || null} onSelect={setSelection} />
        </div>

        {/* Drag Handle - Desktop Only */}
        <div className="w-0 relative hidden lg:flex">
          <div
            className="absolute inset-y-0 -left-1 w-2 cursor-col-resize flex items-center justify-center group"
            onMouseDown={onDragHandleMouseDown}
          >
            <div className="w-px h-full bg-[var(--blueprint-line)] group-hover:bg-[var(--blueprint-accent)] transition-colors" />
          </div>
        </div>

        {/* Detail Panel - hidden on mobile when nothing selected */}
        <div
          className={`flex-1 min-w-0 bg-white dark:bg-[var(--bg-card)] ${
            selection ? 'block' : 'hidden lg:block'
          }`}
        >
          <ProjectDetailPanel selection={selection} onBack={() => setSelection(null)} />
        </div>
      </motion.div>
    </div>
  );
}
