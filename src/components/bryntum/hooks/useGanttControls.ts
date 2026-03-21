'use client';

import { useRef, useCallback } from 'react';
import type { BryntumGantt } from '@bryntum/gantt-react';

export function useGanttControls() {
  const ganttRef = useRef<BryntumGantt>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGanttInstance = useCallback((): any => {
    return (ganttRef.current as unknown as { instance: unknown })?.instance;
  }, []);

  const handleAddTask = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const [task] = gantt.taskStore.add({
      name: 'New Task',
      startDate: new Date(),
      duration: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync().then(() => {
      // Refresh contents so the time axis header re-renders cells for
      // the scrolled position (Bryntum's virtual renderer doesn't always
      // pick up programmatic scroll changes).
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.renderContents();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (task) gantt.scrollTaskIntoView(task, { block: 'center' });
    });
  }, [getGanttInstance]);

  const handleZoomIn = useCallback(() => getGanttInstance()?.zoomIn(), [getGanttInstance]);
  const handleZoomOut = useCallback(() => getGanttInstance()?.zoomOut(), [getGanttInstance]);
  const handleZoomToFit = useCallback(() => {
    getGanttInstance()?.zoomToFit({ leftMargin: 50, rightMargin: 50 });
  }, [getGanttInstance]);
  const handleShiftPrevious = useCallback(
    () => getGanttInstance()?.shiftPrevious(),
    [getGanttInstance]
  );
  const handleShiftNext = useCallback(
    () => getGanttInstance()?.shiftNext(),
    [getGanttInstance]
  );
  const handlePresetChange = useCallback(
    (preset: string) => {
      const gantt = getGanttInstance();
      if (!gantt) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const center = gantt.viewportCenterDate as Date | undefined;
      const anchor = center ?? new Date();

      const rangeMonths: Record<string, number> = {
        hourAndDay: 1,
        weekAndDayLetter: 6,
        weekAndMonth: 12,
        monthAndYear: 36,
      };
      const half = (rangeMonths[preset] ?? 12) / 2;
      const start = new Date(anchor.getFullYear(), anchor.getMonth() - half, 1);
      const end   = new Date(anchor.getFullYear(), anchor.getMonth() + half, 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.setTimeSpan(start, end);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      gantt.viewPreset = preset;
    },
    [getGanttInstance]
  );

  return {
    ganttRef,
    getGanttInstance,
    handleAddTask,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleShiftPrevious,
    handleShiftNext,
    handlePresetChange,
  };
}
