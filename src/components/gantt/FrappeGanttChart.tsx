'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Gantt from 'frappe-gantt';
import { toast } from 'sonner';

// Load frappe-gantt CSS dynamically
if (typeof window !== 'undefined') {
  const linkId = 'frappe-gantt-css';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = '/css/frappe-gantt.css';
    document.head.appendChild(link);
  }
}

export interface FrappeGanttTask {
  id: string;
  name: string;
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
  progress: number;
  dependencies?: string[];
  featureId: string;
  group?: string;
  description?: string;
  [key: string]: unknown;
}

interface ContextMenu {
  x: number;
  y: number;
  featureId: string;
}

interface FrappeGanttChartProps {
  tasks: FrappeGanttTask[];
  groups?: string[];
  onTaskUpdate?: (task: { featureId: string; start: Date; end: Date }) => void;
  onProgressChange?: (featureId: string, progress: number) => void;
  onGroupChange?: (featureId: string, newGroup: string) => void;
}

type ViewMode = 'Day' | 'Week' | 'Month';

export default function FrappeGanttChart({
  tasks,
  groups,
  onTaskUpdate,
  onProgressChange,
  onGroupChange,
}: FrappeGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const tasksRef = useRef(tasks);
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const onProgressChangeRef = useRef(onProgressChange);
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  tasksRef.current = tasks;
  onTaskUpdateRef.current = onTaskUpdate;
  onProgressChangeRef.current = onProgressChange;

  // Mount effect: Create Gantt instance once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // Frappe Gantt needs at least one task
      const ganttTasks = tasks.length > 0 ? tasks : [
        { id: 'placeholder', name: 'No tasks', start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10), progress: 0, featureId: '' },
      ];

      const chart = new Gantt(container, ganttTasks, {
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        bar_height: 30,
        bar_corner_radius: 3,
        padding: 18,
        column_width: 45,
        scroll_to: 'today',

        // Event handlers
        on_date_change: (task: { id: string }, start: Date, end: Date) => {
          const original = tasksRef.current.find((t) => t.id === task.id);
          if (original && onTaskUpdateRef.current) {
            onTaskUpdateRef.current({
              featureId: original.featureId,
              start,
              end,
            });
            toast.success(`Updated ${original.name} dates`);
          }
        },
        on_progress_change: (task: { id: string }, progress: number) => {
          const original = tasksRef.current.find((t) => t.id === task.id);
          if (original && onProgressChangeRef.current) {
            onProgressChangeRef.current(original.featureId, progress);
            toast.success(`Updated ${original.name} progress to ${progress}%`);
          }
        },
        on_view_change: (mode: { name: string }) => {
          console.log('View changed to:', mode.name);
        },

        // Custom popup
        popup: (ctx) => {
          const task = ctx.task;
          const original = tasksRef.current.find((t) => t.id === task.id);

          ctx.set_title(task.name);
          if (original?.description) {
            ctx.set_subtitle(original.description);
          }

          const details = `
            <div style="line-height: 1.6;">
              <div><strong>Timeline:</strong> ${task.start} → ${task.end}</div>
              <div><strong>Progress:</strong> ${task.progress}%</div>
              ${original?.group ? `<div><strong>Group:</strong> ${original.group}</div>` : ''}
              <div><strong>Status:</strong> ${task.progress === 0 ? 'Not started' : task.progress === 100 ? 'Complete' : 'In progress'}</div>
            </div>
          `;
          ctx.set_details(details);
        },
      });

      ganttRef.current = chart;

      // Attach right-click context menu to bar wrappers
      const handleContextMenu = (e: Event) => {
        const me = e as MouseEvent;
        me.preventDefault();
        const wrapper = (me.currentTarget as Element);
        const taskId = wrapper.getAttribute('data-id') ?? '';
        if (!taskId) return;

        // Find the featureId from the task
        const original = tasksRef.current.find((t) => t.id === taskId);
        if (!original) return;

        // Constrain menu position to viewport
        const x = Math.min(me.clientX, window.innerWidth - 180);
        const y = Math.min(me.clientY, window.innerHeight - 200);

        setContextMenu({ x, y, featureId: original.featureId });
      };

      const bars = container.querySelectorAll('.bar-wrapper');
      bars.forEach((bar) => bar.addEventListener('contextmenu', handleContextMenu));

      return () => {
        bars.forEach((bar) => bar.removeEventListener('contextmenu', handleContextMenu));
        container.innerHTML = '';
        ganttRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing Frappe Gantt:', error);
      toast.error('Failed to load Gantt chart');
    }
  }, []);

  // Task refresh effect: Use refresh() instead of full rebuild
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ganttRef.current) return;

    try {
      // Sort tasks by group so they cluster visually
      const sortedTasks = groups && groups.length > 0
        ? [...tasks].sort((a, b) => {
            const aGroup = String(a.group ?? '');
            const bGroup = String(b.group ?? '');
            return groups.indexOf(aGroup) - groups.indexOf(bGroup);
          })
        : tasks;

      // Frappe Gantt needs at least one task
      const ganttTasks = sortedTasks.length > 0 ? sortedTasks : [
        { id: 'placeholder', name: 'No tasks', start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10), progress: 0, featureId: '' },
      ];

      // Use refresh() to update tasks without full rebuild
      ganttRef.current.refresh(ganttTasks);

      // Re-attach context menu listeners to new bar elements
      const bars = container.querySelectorAll('.bar-wrapper');
      const handleContextMenu = (e: Event) => {
        const me = e as MouseEvent;
        me.preventDefault();
        const wrapper = (me.currentTarget as Element);
        const taskId = wrapper.getAttribute('data-id') ?? '';
        if (!taskId) return;

        const original = tasksRef.current.find((t) => t.id === taskId);
        if (!original) return;

        const x = Math.min(me.clientX, window.innerWidth - 180);
        const y = Math.min(me.clientY, window.innerHeight - 200);

        setContextMenu({ x, y, featureId: original.featureId });
      };
      bars.forEach((bar) => bar.addEventListener('contextmenu', handleContextMenu));

      return () => {
        bars.forEach((bar) => bar.removeEventListener('contextmenu', handleContextMenu));
      };
    } catch (error) {
      console.error('Error refreshing Gantt tasks:', error);
    }
  }, [tasks, groups]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    // Use Gantt's built-in change_view_mode for smooth transition
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(mode);
    }
  }, []);

  return (
    <div className="flex flex-col">
      {/* View mode buttons */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[var(--bg-card)] border-b border-gray-200 dark:border-[var(--border-color)]">
        {(['Day', 'Week', 'Month'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === mode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Gantt container */}
      <div
        ref={containerRef}
        style={{ width: '100%', minHeight: '600px' }}
        className="rounded-b-lg border border-gray-200 dark:border-[var(--border-color)] overflow-auto bg-white dark:bg-[var(--bg-card)] shadow-sm transition-colors duration-300"
      />

      {/* Context menu for moving between groups */}
      {contextMenu && groups && groups.length > 0 && (
        <div
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
          className="bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border-color)] rounded-lg shadow-lg py-1 min-w-[160px]"
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Move to group
          </div>
          {groups.map((group) => (
            <button
              key={group}
              onClick={(e) => {
                e.stopPropagation();
                onGroupChange?.(contextMenu.featureId, group);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {group}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
