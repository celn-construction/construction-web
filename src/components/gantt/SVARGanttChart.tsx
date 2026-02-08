'use client';

import { useMemo } from 'react';
import { Gantt, Willow, type IApi } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';

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
}: SVARGanttChartProps) {
  // Transform tasks to SVAR format (id, text, start, duration, progress, type)
  const ganttTasks = useMemo(() => tasks.map(t => ({
    id: t.id,
    text: t.text,
    start: t.start,
    duration: t.duration,
    progress: t.progress / 100, // SVAR expects 0-1, not 0-100
    type: t.type,
  })), [tasks]);

  const scales = useMemo(() => [
    { unit: 'month', step: 1, format: 'MMMM yyyy' },
    { unit: 'day', step: 1, format: 'd' },
  ], []);

  return (
    <Willow>
      <Gantt
        tasks={ganttTasks}
        links={[]}
        scales={scales}
        init={(api: IApi) => {
          // Wire up task update events
          api.intercept('update-task', (data: any) => {
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
        }}
      />
    </Willow>
  );
}
