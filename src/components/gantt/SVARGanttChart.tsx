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
  groups,
  onTaskUpdate,
}: SVARGanttChartProps) {
  const [api, setApi] = useState<IApi | null>(null);
  const { theme } = useThemeStore();

  // Transform tasks to SVAR format (id, text, start, duration, progress, type)
  const ganttTasks = useMemo(() => tasks.map(t => ({
    id: t.id,
    text: t.text,
    start: t.start,
    duration: t.duration,
    progress: t.progress / 100, // SVAR expects 0-1, not 0-100
    type: t.type,
  })), [tasks]);

  // Column configuration for sidebar grid
  const columns: IColumnConfig[] = useMemo(() => [
    { id: 'text', header: 'Task Name', flexgrow: 1 },
    { id: 'start', header: 'Start', width: 100, align: 'center' as const },
    { id: 'duration', header: 'Duration', width: 80, align: 'center' as const },
    { id: 'progress', header: 'Progress', width: 90, align: 'center' as const },
  ], []);

  // Zoom configuration - multi-level time scales
  const zoomConfig = useMemo(() => ({
    level: 2, // Start at month/day view
    levels: [
      {
        minCellWidth: 60,
        maxCellWidth: 200,
        scales: [
          { unit: 'year' as const, step: 1, format: 'yyyy' }
        ]
      },
      {
        minCellWidth: 60,
        maxCellWidth: 200,
        scales: [
          { unit: 'year' as const, step: 1, format: 'yyyy' },
          { unit: 'month' as const, step: 1, format: 'MMM' }
        ]
      },
      {
        minCellWidth: 60,
        maxCellWidth: 200,
        scales: [
          { unit: 'month' as const, step: 1, format: 'MMMM yyyy' },
          { unit: 'day' as const, step: 1, format: 'd' }
        ]
      },
      {
        minCellWidth: 50,
        maxCellWidth: 300,
        scales: [
          { unit: 'day' as const, step: 1, format: 'EEEE, MMM d' },
          { unit: 'hour' as const, step: 6, format: 'HH:mm' }
        ]
      },
    ]
  }), []);

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
  };

  // Theme wrapper - dynamically switch between Willow and WillowDark
  const ThemeWrapper = theme === 'dark' ? WillowDark : Willow;

  return (
    <ThemeWrapper fonts={false}>
      <div className="flex flex-col h-full">
        {api && <Toolbar api={api} />}
        <Tooltip api={api || undefined} content={TooltipContent}>
          <ContextMenu api={api || undefined}>
            <Gantt
              tasks={ganttTasks}
              links={[]}
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
