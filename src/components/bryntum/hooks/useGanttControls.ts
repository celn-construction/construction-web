'use client';

import { useRef, useCallback } from 'react';
import type { BryntumGantt } from '@bryntum/gantt-react';

export function useGanttControls() {
  const ganttRef = useRef<BryntumGantt>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGanttInstance = useCallback((): any => {
    // React strict mode + Ably ChannelProvider create multiple Bryntum widget
    // instances across mount/unmount cycles. The React ref frequently points to
    // a stale, invisible (0×0) widget while the real one lives in the DOM.
    // Always resolve the widget from the DOM to guarantee we operate on the
    // visible instance.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const el = document.querySelector('.b-gantt:not(.b-destroyed)') as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    if (el?.widget) return el.widget;
    // Last resort: try the ref (may be stale)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return (ganttRef.current as any)?.instance;
  }, []);

  const handleAddTask = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) {
      console.log('[Gantt:addTask] No gantt instance!');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ganttId = gantt.id as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ganttEl = gantt.element as HTMLElement | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const projectId = gantt.project?.id as string | undefined;

    console.log('[Gantt:addTask] widget id:', ganttId,
      'element id:', ganttEl?.id,
      'element size:', ganttEl?.offsetWidth, 'x', ganttEl?.offsetHeight,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'isVisible:', gantt.isVisible,
      'project id:', projectId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'taskStore count:', gantt.taskStore?.count,
    );

    // Compare widget's taskStore vs project's taskStore — are they the same?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const widgetStore = gantt.taskStore;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const projectStore = gantt.project?.taskStore;
    console.log('[Gantt:addTask] taskStore identity check — same object:', widgetStore === projectStore,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'widget store id:', widgetStore?.id, 'project store id:', projectStore?.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'widget store count:', widgetStore?.count, 'project store count:', projectStore?.count,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const [task] = gantt.taskStore.add({
      name: 'New Task',
      startDate: new Date(),
      duration: 1,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('[Gantt:addTask] After add — task:', task?.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'taskStore count:', gantt.taskStore?.count,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      'rowCount:', gantt.rowManager?.rowCount,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('[Gantt:addTask] commitAsync resolved —',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'taskStore:', gantt.taskStore?.count,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'rowCount:', gantt.rowManager?.rowCount,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'task dates:', task?.startDate, '→', task?.endDate,
      );

      // Inspect actual cell content in DOM rows
      const rowEls = document.querySelectorAll('.b-grid-row');
      console.log('[Gantt:addTask] .b-grid-row count:', rowEls.length);
      rowEls.forEach((el, i) => {
        const re = el as HTMLElement;
        const cells = re.querySelectorAll('.b-grid-cell');
        const cellTexts = Array.from(cells).map(c => `"${(c as HTMLElement).innerText?.trim()}"`).join(', ');
        console.log(`[Gantt:addTask] row[${i}]: ${re.offsetWidth}x${re.offsetHeight}, transform: ${re.style.transform}, top: ${re.style.top}, cells: [${cellTexts}], parent: ${re.parentElement?.className}`);
      });

      // Check if task bars exist in the schedule area
      const taskBars = document.querySelectorAll('.b-gantt-task');
      console.log('[Gantt:addTask] .b-gantt-task (task bars) count:', taskBars.length);
      taskBars.forEach((el, i) => {
        const te = el as HTMLElement;
        console.log(`[Gantt:addTask] bar[${i}]: ${te.offsetWidth}x${te.offsetHeight}, left: ${te.style.left}, transform: ${te.style.transform}`);
      });

      // DO NOT call gantt.refresh() here — it wipes cell content from the rows.
      // renderContents only refreshes the time axis header (safe).
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.renderContents();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (task) gantt.scrollTaskIntoView(task, { block: 'center' });

      // Check task bars after scroll (may need a frame to render)
      requestAnimationFrame(() => {
        const barsAfter = document.querySelectorAll('.b-gantt-task');
        console.log('[Gantt:addTask] After scroll (rAF) — task bars:', barsAfter.length);
        const rowElsAfter = document.querySelectorAll('.b-grid-row');
        rowElsAfter.forEach((el, i) => {
          const re = el as HTMLElement;
          const cells = re.querySelectorAll('.b-grid-cell');
          const cellTexts = Array.from(cells).map(c => `"${(c as HTMLElement).innerText?.trim()}"`).join(', ');
          console.log(`[Gantt:addTask] after[${i}]: cells: [${cellTexts}]`);
        });
      });
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
