'use client';

import { useRef, useCallback } from 'react';
import type { BryntumGantt } from '@bryntum/gantt-react';

export function useGanttControls() {
  const ganttRef = useRef<BryntumGantt>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGanttInstance = useCallback((): any => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const refInstance = (ganttRef.current as any)?.instance;
    // React strict mode + Ably ChannelProvider can create multiple Bryntum
    // widget instances across mount/unmount cycles. The ref may point to a
    // stale widget (0×0, invisible) while the real one is in the DOM.
    // Validate the ref instance; if it's stale, find the active widget from the DOM.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (refInstance && !refInstance.isDestroyed && refInstance.isVisible) {
      return refInstance;
    }
    // Fallback: find the visible Bryntum Gantt widget from the DOM
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const el = document.querySelector('.b-gantt:not(.b-destroyed)') as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const domWidget = el?.widget;
    if (domWidget) {
      console.log('[Gantt:getGanttInstance] Ref was stale (element 0x0 or invisible), using DOM widget instead. refInstance isVisible:', refInstance?.isVisible, 'domWidget id:', domWidget?.id);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return domWidget ?? refInstance;
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

      // Check visual state of subgrids
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const subGrids = gantt.subGrids as Record<string, { element?: HTMLElement; height?: number; scrollable?: { scrollHeight?: number } }> | undefined;
      if (subGrids) {
        for (const [name, sg] of Object.entries(subGrids)) {
          console.log(`[Gantt:addTask] subGrid "${name}":`,
            'element size:', sg.element?.offsetWidth, 'x', sg.element?.offsetHeight,
            'scrollHeight:', sg.scrollable?.scrollHeight,
          );
        }
      }

      // Check row elements in DOM
      const rowEls = document.querySelectorAll('.b-grid-row');
      console.log('[Gantt:addTask] .b-grid-row elements in DOM:', rowEls.length);
      rowEls.forEach((el, i) => {
        const re = el as HTMLElement;
        console.log(`[Gantt:addTask] row[${i}] size: ${re.offsetWidth}x${re.offsetHeight}, top: ${re.style.top}, display: ${re.style.display}, className: ${re.className}`);
      });

      // Force a full refresh of the Gantt to ensure rows render
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      console.log('[Gantt:addTask] Calling gantt.refresh()');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.refresh();

      // Refresh contents so the time axis header re-renders cells for
      // the scrolled position (Bryntum's virtual renderer doesn't always
      // pick up programmatic scroll changes).
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.renderContents();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (task) gantt.scrollTaskIntoView(task, { block: 'center' });

      // Log state after refresh
      const rowElsAfter = document.querySelectorAll('.b-grid-row');
      console.log('[Gantt:addTask] After refresh — .b-grid-row count:', rowElsAfter.length);
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
