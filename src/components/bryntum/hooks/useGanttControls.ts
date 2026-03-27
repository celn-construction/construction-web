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
    console.log('[Gantt:addTask] gantt instance:', !!gantt);
    if (!gantt) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('[Gantt:addTask] Before add — taskStore count:', gantt.taskStore?.count,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'project ready:', gantt.project?.isEngineReady,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'isDestroyed:', gantt.isDestroyed,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'isVisible:', gantt.isVisible,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'element size:', gantt.element?.offsetWidth, 'x', gantt.element?.offsetHeight,
    );

    // Check for ghost widgets
    const allGantts = document.querySelectorAll('.b-gantt');
    console.log('[Gantt:addTask] .b-gantt elements in DOM:', allGantts.length);
    allGantts.forEach((el, i) => {
      const ge = el as HTMLElement;
      console.log(`[Gantt:addTask] .b-gantt[${i}] size: ${ge.offsetWidth}x${ge.offsetHeight}, visible: ${ge.style.display !== 'none'}`);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const [task] = gantt.taskStore.add({
      name: 'New Task',
      startDate: new Date(),
      duration: 1,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('[Gantt:addTask] After add — task:', task?.id, 'taskStore count:', gantt.taskStore?.count,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'task startDate:', task?.startDate, 'task duration:', task?.duration,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'rowCount:', gantt.rowManager?.rowCount,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('[Gantt:addTask] commitAsync resolved — taskStore count:', gantt.taskStore?.count,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'rowCount:', gantt.rowManager?.rowCount,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'task startDate:', task?.startDate, 'task endDate:', task?.endDate,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'timeAxis start:', gantt.timeAxis?.startDate, 'timeAxis end:', gantt.timeAxis?.endDate,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'isDestroyed:', gantt.isDestroyed,
      );
      // Refresh contents so the time axis header re-renders cells for
      // the scrolled position (Bryntum's virtual renderer doesn't always
      // pick up programmatic scroll changes).
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.renderContents();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (task) gantt.scrollTaskIntoView(task, { block: 'center' });
    }).catch((err: unknown) => {
      console.error('[Gantt:addTask] commitAsync FAILED:', err);
    });
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

      // Capture the current center date so the viewport stays on the same
      // point after the preset change.  infiniteScroll handles the range.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const center = gantt.viewportCenterDate as Date | undefined;
      const anchor = center ?? new Date();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      gantt.viewPreset = preset;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.scrollToDate(anchor, { block: 'center' });
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
