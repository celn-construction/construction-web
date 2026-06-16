'use client';

import { useRef, useCallback, useState } from 'react';
import type { BryntumGantt } from '@bryntum/gantt-react';

export function useGanttControls() {
  const ganttRef = useRef<BryntumGantt>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGanttInstance = useCallback((): any => {
    return (ganttRef.current as unknown as { instance: unknown })?.instance;
  }, []);

  const handleAddTask = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const taskStore = gantt.taskStore;

    // Seed each task with a unique "Task N". Picking N from the existing
    // names (not just count+1) avoids collisions after deletes, and giving
    // every row a real name up-front means an auto-sync mid-edit can't
    // ship an empty name to the server.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const existing = new Set<string>(
      (taskStore.allRecords as Array<{ name?: string }>).map((r) => r.name ?? '')
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let n = (taskStore.count as number) + 1;
    while (existing.has(`Task ${n}`)) n++;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const added = taskStore.add({
      name: `Task ${n}`,
      startDate,
      endDate,
      duration: 5,
    });
    const record = (Array.isArray(added) ? added[0] : added) as
      | { startDate: Date }
      | undefined;
    if (!record) return;

    // The new task isn't fully materialized in the project graph until the
    // next commit. Touching it before then (selectedRecords setter, then
    // startEditing) reaches into a half-built record and throws
    // "Cannot set properties of undefined (setting 'isBeingMaterialized')".
    // commitAsync resolves once the project finishes propagating the add.
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await gantt.project?.commitAsync?.();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await gantt.scrollRowIntoView(record);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.scrollToDate?.(record.startDate, { block: 'center' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      gantt.selectedRecords = [record];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.startEditing({ record, field: 'name' });
    })();
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
  // Scroll the timeline so today is centered. Uses scrollToDate — the
  // proven-safe scroll path in this codebase (handleAddTask + the "Scroll to
  // item" task menu both use it). scrollTaskIntoView is the one that corrupts
  // the time-axis header virtual renderer; scrollToDate does not.
  const handleScrollToToday = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gantt.scrollToDate?.(new Date(), { block: 'center', animate: 300 });
  }, [getGanttInstance]);
  const handlePresetChange = useCallback(
    (preset: string) => {
      const gantt = getGanttInstance();
      if (!gantt) return;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      gantt.viewPreset = preset;
    },
    [getGanttInstance]
  );

  // Collapse/expand every parent task. collapseAll()/expandAll() are surfaced
  // on the Gantt instance by the Tree feature. We track collapsed state locally
  // so a single toolbar button can toggle between the two.
  const handleToggleCollapseAll = useCallback(() => {
    const gantt = getGanttInstance();
    if (!gantt) return;
    setAllCollapsed((prev) => {
      const next = !prev;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (next) gantt.collapseAll();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      else gantt.expandAll();
      return next;
    });
  }, [getGanttInstance]);

  /** Refresh canUndo/canRedo from STM state */
  const updateUndoRedoState = useCallback(() => {
    const gantt = getGanttInstance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const stm = gantt?.project?.stm;
    if (!stm) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    setCanUndo(!!stm.canUndo);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    setCanRedo(!!stm.canRedo);
  }, [getGanttInstance]);

  /**
   * Enable STM after data is loaded. Must be called once after the initial
   * commitAsync so that the data load itself is not recorded as undoable.
   * Also attaches listeners to keep canUndo/canRedo in sync.
   * Returns a cleanup function to remove listeners on unmount.
   */
  const enableStm = useCallback((): (() => void) => {
    const gantt = getGanttInstance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const stm = gantt?.project?.stm;
    if (!stm) return () => {};

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stm.enable();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stm.on('recordingStop', updateUndoRedoState);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stm.on('restoringStop', updateUndoRedoState);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stm.on('queueReset', updateUndoRedoState);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stm.on('disabled', updateUndoRedoState);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stm.un('recordingStop', updateUndoRedoState);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stm.un('restoringStop', updateUndoRedoState);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stm.un('queueReset', updateUndoRedoState);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stm.un('disabled', updateUndoRedoState);
    };
  }, [getGanttInstance, updateUndoRedoState]);

  const handleUndo = useCallback(() => {
    const gantt = getGanttInstance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const stm = gantt?.project?.stm;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stm?.canUndo) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stm.undo();
    }
  }, [getGanttInstance]);

  const handleRedo = useCallback(() => {
    const gantt = getGanttInstance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const stm = gantt?.project?.stm;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stm?.canRedo) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stm.redo();
    }
  }, [getGanttInstance]);

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
    handleScrollToToday,
    handlePresetChange,
    handleToggleCollapseAll,
    allCollapsed,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    enableStm,
  };
}
