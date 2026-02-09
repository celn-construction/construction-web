'use client';

import { useMemo, useState } from 'react';
import {
  Gantt,
  Willow,
  WillowDark,
  Toolbar,
  Tooltip,
  ContextMenu,
  Editor,
  type IApi,
  type IColumnConfig,
} from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { useThemeStore } from '@/store/useThemeStore';

export interface SVARGanttTask {
  id: number;
  text: string;
  start: Date;
  end: Date;
  duration: number;
  progress: number;
  type: 'task' | 'milestone' | 'summary';
  featureId: string;
  group?: string;
  parent?: number;
  open?: boolean;
}

export interface SVARGanttLink {
  id: number;
  source: number;
  target: number;
  type: 'e2s' | 'e2e' | 's2s' | 's2e';
}

interface SVARGanttChartProps {
  tasks: SVARGanttTask[];
  links?: SVARGanttLink[];
  groups?: string[];
  onTaskUpdate?: (task: { featureId: string; start: Date; end: Date }) => void;
  onTaskAdd?: (task: { text: string; start: Date; duration: number; progress: number; parent?: number }) => void;
  onTaskDelete?: (featureId: string) => void;
  onGroupChange?: (featureId: string, newGroup: string) => void;
}

// Custom tooltip content component
function TooltipContent({ data }: { data: any }) {
  // Guard against null or undefined data
  if (!data || !data.start) {
    return null;
  }

  const startDate = data.start instanceof Date ? data.start : new Date(data.start);
  const endDate = new Date(startDate.getTime() + data.duration * 24 * 60 * 60 * 1000);
  const progressPercent = Math.round((data.progress || 0) * 100);

  return (
    <div className="p-3 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">{data.text}</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Start:</span>
          <span className="font-medium">{startDate.toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">End:</span>
          <span className="font-medium">{endDate.toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Duration:</span>
          <span className="font-medium">{data.duration} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Progress:</span>
          <span className="font-medium">{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
}

export default function SVARGanttChart({
  tasks,
  links = [],
  groups,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete,
}: SVARGanttChartProps) {
  const [api, setApi] = useState<IApi | null>(null);
  const { theme } = useThemeStore();

  // Ensure links is always an array (safety check)
  const safeLinks = useMemo(() => links || [], [links]);

  // Transform tasks to SVAR format with hierarchy support
  const ganttTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      console.log('[SVARGantt] No tasks to transform');
      return [];
    }

    console.log('[SVARGantt] Transforming tasks:', tasks.length);

    try {
      const transformed = tasks.map(t => {
        // Ensure all required fields are present
        if (!t || typeof t.id !== 'number') {
          console.error('[SVARGantt] Invalid task:', t);
          return null;
        }

        const task: any = {
          id: t.id,
          text: t.text || 'Untitled',
          start: t.start || new Date(),
          duration: t.duration || 1,
          progress: (t.progress || 0) / 100, // SVAR expects 0-1, not 0-100
          type: t.type || 'task',
          open: t.open !== undefined ? t.open : true, // Default to expanded
        };

        // Only add parent if it's a valid number
        if (typeof t.parent === 'number') {
          task.parent = t.parent;
        }

        return task;
      }).filter(Boolean); // Remove any null tasks

      console.log('[SVARGantt] Transformed tasks:', transformed);
      return transformed;
    } catch (error) {
      console.error('[SVARGantt] Error transforming tasks:', error);
      return [];
    }
  }, [tasks]);

  // Column configuration for sidebar grid
  const columns: IColumnConfig[] = useMemo(() => [
    {
      id: 'text',
      header: 'Task Name',
      flexgrow: 1,
      tree: true, // Enable tree/hierarchy display
    },
    {
      id: 'start',
      header: 'Start date',
      width: 120,
      align: 'left' as const,
    },
    {
      id: 'duration',
      header: 'Duration',
      width: 100,
      align: 'center' as const,
    },
  ], []);

  // Simplified zoom configuration to avoid null errors
  const zoomConfig = useMemo(() => {
    console.log('[SVARGantt] Creating zoom config');
    return {
      levels: [
        {
          minCellWidth: 60,
          scales: [
            { unit: 'month', step: 1, format: 'MMMM yyyy' },
            { unit: 'day', step: 1, format: 'd' }
          ]
        }
      ]
    };
  }, []);

  // Weekend highlighting function
  const highlightWeekends = (date: Date, unit: string) => {
    if (unit === 'day') {
      const day = date.getDay();
      return (day === 0 || day === 6) ? 'weekend-cell' : '';
    }
    return '';
  };

  // Initialize API and wire up task update events
  const handleInit = (ganttApi: IApi) => {
    setApi(ganttApi);

    // Wire up task update events
    ganttApi.intercept('update-task', (data: any) => {
      const original = tasks.find(t => t.id === data.id);
      if (original && onTaskUpdate) {
        const newStart = new Date(data.start);
        const newEnd = new Date(newStart.getTime() + data.duration * 24 * 60 * 60 * 1000);
        onTaskUpdate({
          featureId: original.featureId,
          start: newStart,
          end: newEnd
        });
      }
    });

    // Wire up task add events
    ganttApi.intercept('add-task', (data: any) => {
      if (onTaskAdd && data.task) {
        onTaskAdd({
          text: data.task.text || 'New Task',
          start: data.task.start || new Date(),
          duration: data.task.duration || 7,
          progress: data.task.progress || 0,
          parent: data.task.parent,
        });
      }
    });

    // Wire up task delete events
    ganttApi.intercept('delete-task', (data: any) => {
      if (onTaskDelete && data.id) {
        const original = tasks.find(t => t.id === data.id);
        if (original) {
          onTaskDelete(original.featureId);
        }
      }
    });
  };

  // Theme wrapper - dynamically switch between Willow and WillowDark
  const ThemeWrapper = theme === 'dark' ? WillowDark : Willow;

  // Show loading state if no tasks yet
  if (!ganttTasks || ganttTasks.length === 0) {
    console.log('[SVARGantt] Rendering empty state');
    return (
      <div className="w-full h-full min-h-[600px] rounded-lg border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-card)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No tasks available</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add tasks to get started</p>
        </div>
      </div>
    );
  }

  console.log('[SVARGantt] Rendering Gantt with:', {
    tasks: ganttTasks.length,
    links: safeLinks.length,
    columns: columns.length,
    zoom: zoomConfig,
    highlightTime: typeof highlightWeekends
  });

  // Validate all props before rendering
  if (!Array.isArray(ganttTasks)) {
    console.error('[SVARGantt] ganttTasks is not an array:', ganttTasks);
    return <div>Error: Invalid tasks data</div>;
  }

  if (!Array.isArray(safeLinks)) {
    console.error('[SVARGantt] safeLinks is not an array:', safeLinks);
    return <div>Error: Invalid links data</div>;
  }

  if (!Array.isArray(columns)) {
    console.error('[SVARGantt] columns is not an array:', columns);
    return <div>Error: Invalid columns data</div>;
  }

  return (
    <ThemeWrapper fonts={false}>
      <div className="flex flex-col h-full">
        {api && <Toolbar api={api} />}
        <Tooltip api={api || undefined} content={TooltipContent}>
          <ContextMenu api={api || undefined}>
            <Gantt
              tasks={ganttTasks}
              links={safeLinks}
              columns={columns}
              zoom={zoomConfig}
              cellHeight={38}
              cellWidth={50}
              highlightTime={highlightWeekends}
              init={handleInit}
            />
          </ContextMenu>
        </Tooltip>
        {api && <Editor api={api} />}
      </div>
    </ThemeWrapper>
  );
}
