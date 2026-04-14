'use client';

import { useRef, useCallback, useState } from 'react';
import type { BryntumGantt } from '@bryntum/gantt-react';

export function useGanttControls() {
  const ganttRef = useRef<BryntumGantt>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
    handlePresetChange,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    enableStm,
  };
}
