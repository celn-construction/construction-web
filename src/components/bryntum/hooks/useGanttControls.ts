'use client';

import { useRef, useCallback } from 'react';
import type { BryntumGantt } from '@bryntum/gantt-react';

export function useGanttControls() {
  const ganttRef = useRef<BryntumGantt>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGanttInstance = useCallback((): any => {
    // React strict mode + dynamic imports can create multiple Bryntum widget
    // instances. The React ref may point to a stale widget. Always resolve
    // from the DOM to guarantee we operate on the visible instance.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const el = document.querySelector('.b-gantt:not(.b-destroyed)') as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    if (el?.widget) return el.widget;
    // Last resort: try the ref
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return (ganttRef.current as any)?.instance;
  }, []);

  const handleAddTask = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;

    // DEBUG: log the state of the widget before adding
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('[AddTask] Before add — taskStore count:', gantt.taskStore?.count,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'rowManager rows:', gantt.rowManager?.rowCount,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'element:', gantt.element?.offsetWidth, 'x', gantt.element?.offsetHeight,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'isDestroyed:', gantt.isDestroyed,
      'b-gantt count:', document.querySelectorAll('.b-gantt').length,
      'b-gantt not-destroyed:', document.querySelectorAll('.b-gantt:not(.b-destroyed)').length,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gantt.taskStore.add({
      name: 'New Task',
      startDate: new Date(),
      duration: 1,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('[AddTask] After add — taskStore count:', gantt.taskStore?.count,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'rowManager rows:', gantt.rowManager?.rowCount,
    );
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
