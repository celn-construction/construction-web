'use client';

import { useMemo, useState, useEffect, useRef } from 'react';

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

interface SVARGanttChartProps {
  tasks: SVARGanttTask[];
  groups?: string[];
  onTaskUpdate?: (task: { featureId: string; start: Date; end: Date }) => void;
  onGroupChange?: (featureId: string, newGroup: string) => void;
}

export default function SVARGanttChart({
  tasks,
  groups,
  onTaskUpdate,
  onGroupChange,
}: SVARGanttChartProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [GanttComponent, setGanttComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const loadAttempted = useRef(false);

  // Load SVAR Gantt only on client side
  useEffect(() => {
    if (loadAttempted.current) return;
    loadAttempted.current = true;

    const loadGantt = async () => {
      try {
        // Dynamically import wx-react-gantt
        const { Gantt } = await import('wx-react-gantt');

        // Load CSS files
        const cssFiles = [
          { id: 'wx-gantt-css', href: '/css/wx-gantt.css' },
          { id: 'svar-gantt-custom-css', href: '/css/svar-gantt-custom.css' },
        ];

        cssFiles.forEach(({ id, href }) => {
          if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.id = id;
            document.head.appendChild(link);
          }
        });

        setGanttComponent(() => Gantt);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load SVAR Gantt:', err);
        setError('Failed to load Gantt chart library');
      }
    };

    // Ensure we're in browser
    if (typeof window !== 'undefined') {
      loadGantt();
    }
  }, []);

  // Transform tasks to SVAR Gantt format
  const ganttTasks = useMemo(() => {
    return tasks.map((task) => ({
      id: task.id,
      text: task.text,
      start: task.start,
      end: task.end,
      duration: task.duration,
      progress: task.progress,
      type: task.type,
      lazy: false,
    }));
  }, [tasks]);

  // Timeline scales configuration
  const scales = useMemo(() => [
    { unit: 'month' as const, step: 1, format: 'MMMM yyyy' },
    { unit: 'day' as const, step: 1, format: 'd' },
  ], []);

  // No links for now
  const links = useMemo(() => [], []);

  // Column configuration
  const columns = useMemo(() => [
    {
      id: 'text',
      header: 'Task Name',
      width: 250,
      flexgrow: 1,
    },
    {
      id: 'start',
      header: 'Start',
      width: 100,
      align: 'center' as const,
    },
    {
      id: 'duration',
      header: 'Duration',
      width: 80,
      align: 'center' as const,
    },
  ], []);

  // Show error state
  if (error) {
    return (
      <div className="svar-gantt-wrapper h-full w-full min-h-[600px] flex items-center justify-center bg-white dark:bg-[var(--bg-card)] rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex flex-col items-center gap-3 text-red-600 dark:text-red-400">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-center">
            <p className="font-semibold">{error}</p>
            <p className="text-sm mt-1">Please check console for details</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isLoaded || !GanttComponent) {
    return (
      <div className="svar-gantt-wrapper h-full w-full min-h-[600px] flex items-center justify-center bg-white dark:bg-[var(--bg-card)] rounded-lg border border-gray-200 dark:border-[var(--border-color)]">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading Gantt Chart...</span>
        </div>
      </div>
    );
  }

  // Render the Gantt component
  return (
    <div className="svar-gantt-wrapper h-full w-full min-h-[600px]">
      <GanttComponent
        tasks={ganttTasks}
        links={links}
        scales={scales}
        columns={columns}
      />
    </div>
  );
}
