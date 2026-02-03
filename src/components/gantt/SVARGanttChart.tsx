'use client';

import { useRef, useEffect, useState } from 'react';
import { Gantt } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';

export interface SVARGanttTask {
  id: number;
  text: string;
  start: Date;
  end: Date;
  duration: number;
  progress: number;
  type: 'task';
  featureId: string;
  group?: string;
}

interface ContextMenu {
  x: number;
  y: number;
  featureId: string;
}

interface SVARGanttChartProps {
  tasks: SVARGanttTask[];
  groups?: string[];
  onTaskUpdate?: (task: { featureId: string; start: Date; end: Date }) => void;
  onGroupChange?: (featureId: string, newGroup: string) => void;
}

const scales = [
  { unit: 'month', step: 1, format: 'MMMM yyy' },
  { unit: 'day', step: 1, format: 'd' },
];

const columns = [
  { id: 'text', header: 'Task name', flexgrow: 2, sort: true },
  { id: 'start', header: 'Start date', flexgrow: 1, align: 'center' as const, sort: true },
  { id: 'duration', header: 'Duration', width: 90, align: 'center' as const, sort: true },
  { id: 'action', header: '', width: 50, align: 'center' as const },
];

export default function SVARGanttChart({
  tasks,
  groups,
  onTaskUpdate,
  onGroupChange,
}: SVARGanttChartProps) {
  const apiRef = useRef<any>(null);
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const tasksRef = useRef(tasks);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  onTaskUpdateRef.current = onTaskUpdate;
  tasksRef.current = tasks;

  useEffect(() => {
    if (!apiRef.current) return;

    const api = apiRef.current;

    const unsubUpdate = api.on('update-task', (ev: any) => {
      if (ev.inProgress) return;
      const { id, task: updatedFields } = ev;
      const original = tasksRef.current.find((t) => t.id === id);
      if (!original || !onTaskUpdateRef.current) return;

      const start = updatedFields?.start ?? original.start;
      const end = updatedFields?.end ?? original.end;

      onTaskUpdateRef.current({
        featureId: original.featureId,
        start: start instanceof Date ? start : new Date(start),
        end: end instanceof Date ? end : new Date(end),
      });
    });

    return () => {
      if (typeof unsubUpdate === 'function') unsubUpdate();
    };
  }, []);

  // Handle right-click on the gantt container for context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Find the closest task bar element
    const barEl = target.closest('[data-task-id]');
    if (!barEl) return;

    e.preventDefault();
    const taskId = Number(barEl.getAttribute('data-task-id'));
    const original = tasksRef.current.find((t) => t.id === taskId);
    if (!original) return;

    setContextMenu({ x: e.clientX, y: e.clientY, featureId: original.featureId });
  };

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  return (
    <div className="flex flex-col" onContextMenu={handleContextMenu}>
      {/* Gantt chart */}
      <div
        style={{ width: '100%', minHeight: '600px' }}
        className="rounded-lg border border-gray-200 dark:border-[var(--border-color)] overflow-auto bg-white dark:bg-[var(--bg-card)] shadow-sm transition-colors duration-300"
      >
        <Gantt
          init={(api: any) => { apiRef.current = api; }}
          tasks={tasks}
          scales={scales}
          columns={columns}
          zoom={true}
        />
      </div>

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
