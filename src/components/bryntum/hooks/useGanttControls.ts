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
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gantt.taskStore.add({
      name: 'New Task',
      startDate: now,
      endDate: tomorrow,
      duration: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync();
  }, [getGanttInstance]);

  const handleIndent = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const selected = gantt.selectedRecords as unknown[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (selected?.length) gantt.indent(selected);
  }, [getGanttInstance]);

  const handleOutdent = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const selected = gantt.selectedRecords as unknown[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (selected?.length) gantt.outdent(selected);
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
      gantt.viewPreset = preset;
    },
    [getGanttInstance]
  );

  return {
    ganttRef,
    getGanttInstance,
    handleAddTask,
    handleIndent,
    handleOutdent,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleShiftPrevious,
    handleShiftNext,
    handlePresetChange,
  };
}
