'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { CircularProgress, Box } from '@mui/material';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/trpc/react';
import { createGanttConfig } from './config/ganttConfig';
import { BryntumPanelHeader } from './components/BryntumPanelHeader';
import { TaskDetailsPopover } from './components/TaskDetailsPopover';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useBryntumThemeAssets } from './hooks/useBryntumThemeAssets';
import { useTaskPopover } from './hooks/useTaskPopover';
import { useGanttControls } from './hooks/useGanttControls';
import { validateParentDuration } from './utils/ganttValidation';

const WRAPPER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-card)',
};

const GANTT_CONTENT_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'clip',
};

const STALE_THRESHOLD_MS = 60_000; // 60 seconds

interface BryntumGanttWrapperProps {
  projectId?: string;
  isVisible?: boolean;
}

export default function BryntumGanttWrapper({ projectId, isVisible = true }: BryntumGanttWrapperProps) {
  const theme = useThemeStore((state) => state.theme);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const justSavedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isRevertingRef = useRef(false);

  const { showSnackbar } = useSnackbar();

  const { selectedTask, popoverPlacement, handleTaskClick, closeTaskPopover, isTaskPopoverOpen } =
    useTaskPopover();

  useBryntumThemeAssets(theme);

  const {
    ganttRef,
    getGanttInstance,
    handleAddTask,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    handleShiftPrevious,
    handleShiftNext,
    handlePresetChange,
  } = useGanttControls();

  // After data loads, finalize the project so the scheduling engine and layout are
  // fully ready before the user can interact.  delayCalculation defers the initial
  // engine run until commitAsync — calling it here ensures the project is calculated
  // before "Add Task" or any other interaction.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    gantt.toggleParentTasksOnClick = false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync();
  }, [isLoading, getGanttInstance]);

  const handleSave = useCallback(async () => {
    const gantt = getGanttInstance();
    if (!gantt?.project) return;
    setIsSaving(true);
    await gantt.project.sync();
    // isSaving and hasPendingChanges are reset by the sync/syncFail event listeners
  }, [getGanttInstance]);

  // Invalidate tRPC cache when Bryntum syncs so sibling components (e.g. file tree) refetch
  const utils = api.useUtils();
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt?.project) return;

    const onSync = () => {
      setIsSaving(false);
      setHasPendingChanges(false);
      setJustSaved(true);
      clearTimeout(justSavedTimerRef.current);
      justSavedTimerRef.current = setTimeout(() => setJustSaved(false), 2000);
      void utils.gantt.tasks.invalidate();
    };
    const onSyncFail = () => {
      setIsSaving(false);
      // hasPendingChanges stays true — changes weren't saved
    };

    gantt.project.on('sync', onSync);
    gantt.project.on('syncFail', onSyncFail);
    return () => {
      gantt.project?.un('sync', onSync);
      gantt.project?.un('syncFail', onSyncFail);
      clearTimeout(justSavedTimerRef.current);
    };
  }, [isLoading, getGanttInstance, utils]);

  // Mark pending changes when any store is modified locally
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt?.project) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stores: any[] = [
      gantt.project.taskStore,
      gantt.project.dependencyStore,
      gantt.project.resourceStore,
      gantt.project.assignmentStore,
      gantt.project.timeRangeStore,
    ];
    const onStoreChange = () => setHasPendingChanges(true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stores.forEach(store => store?.on('change', onStoreChange));
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stores.forEach(store => store?.un('change', onStoreChange));
    };
  }, [isLoading, getGanttInstance]);

  // Validate parent task duration: revert and warn if shortened below subtask span
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt?.project?.taskStore) return;

    const onTaskUpdate = ({ record, changes }: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      record: any;
      changes: Record<string, { oldValue: unknown; value: unknown }>;
    }) => {
      if (isRevertingRef.current) return;

      const schedulingFields = ['duration', 'startDate', 'endDate'];
      const hasSchedulingChange = schedulingFields.some(f => f in changes);
      if (!hasSchedulingChange) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const error = validateParentDuration(record);
      if (!error) return;

      isRevertingRef.current = true;
      try {
        const revertData: Record<string, unknown> = {};
        for (const field of schedulingFields) {
          if (field in changes) {
            revertData[field] = changes[field]!.oldValue;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        record.set(revertData);
      } finally {
        isRevertingRef.current = false;
      }

      showSnackbar(error, 'warning');
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gantt.project.taskStore.on('update', onTaskUpdate);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.project?.taskStore?.un('update', onTaskUpdate);
    };
  }, [isLoading, getGanttInstance, showSnackbar]);

  // Close the task popover when the selected task is removed (e.g. parent deletion cascades)
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt?.project?.taskStore) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onTaskRemove = ({ records }: { records: any[] }) => {
      if (!selectedTask) return;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const removedIds = new Set(records.map((r) => String(r.id)));
      if (removedIds.has(selectedTask.id)) {
        closeTaskPopover();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gantt.project.taskStore.on('remove', onTaskRemove);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.project?.taskStore?.un('remove', onTaskRemove);
    };
  }, [isLoading, getGanttInstance, selectedTask, closeTaskPopover]);

  // Silently refresh data when returning to the Gantt tab after the stale threshold.
  // Bryntum's CrudManager merges fresh data without resetting scroll, selections, or expanded state.
  const hiddenSinceRef = useRef(0);
  useEffect(() => {
    if (isVisible) {
      const hiddenDuration = Date.now() - hiddenSinceRef.current;
      if (hiddenSinceRef.current > 0 && hiddenDuration > STALE_THRESHOLD_MS) {
        const gantt = getGanttInstance();
        if (gantt?.project) {
          gantt.project.load();
        }
      }
    } else {
      hiddenSinceRef.current = Date.now();
    }
  }, [isVisible, getGanttInstance]);

  // Bryntum React best practice: use useState (not useMemo) so the config object is
  // created exactly once and never recreated on re-render.  A new config reference
  // would make the React wrapper re-initialise the Bryntum instance (including
  // autoLoad), which wipes locally-added tasks.
  const [ganttConfig] = useState(() => createGanttConfig(projectId, {
    onLoadStart: () => {
      setIsLoading(true);
      setLoadError(null);
    },
    onLoadComplete: () => {
      setIsLoading(false);
    },
    onLoadError: (error: string) => {
      setIsLoading(false);
      setLoadError(error);
    },
  }));

  // Attach the taskClick listener on the Bryntum instance (not in the static config)
  // so we can use the latest handleTaskClick reference from useTaskPopover.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gantt.on('taskClick', handleTaskClick);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return () => { gantt.un('taskClick', handleTaskClick); };
  }, [isLoading, getGanttInstance, handleTaskClick]);

  return (
    <div style={WRAPPER_STYLE}>
      <BryntumPanelHeader
        title="Bryntum Schedule"
        onAddTask={handleAddTask}
        onPresetChange={handlePresetChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomToFit={handleZoomToFit}
        onShiftPrevious={handleShiftPrevious}
        onShiftNext={handleShiftNext}
        onSave={handleSave}
        isSaving={isSaving}
        hasPendingChanges={hasPendingChanges}
        justSaved={justSaved}
      />

      {/* Bryntum must always render in a visible container so its internal layout
          calculations use real dimensions.  The loading/error overlays sit on top. */}
      <div style={GANTT_CONTENT_STYLE} className="bryntum-gantt-container">
        <BryntumGantt ref={ganttRef} {...ganttConfig} />

        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              bgcolor: 'var(--bg-card)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
            <div>Loading Gantt chart data...</div>
          </Box>
        )}

        {loadError && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              color: 'error.main',
              bgcolor: 'var(--bg-card)',
              zIndex: 1,
            }}
          >
            <div>Failed to load Gantt chart</div>
            <div style={{ fontSize: '0.875rem' }}>{loadError}</div>
          </Box>
        )}
      </div>

      <TaskDetailsPopover
        open={isTaskPopoverOpen}
        taskName={selectedTask?.name ?? ''}
        taskId={selectedTask?.id}
        popoverPlacement={popoverPlacement}
        onClose={closeTaskPopover}
      />
    </div>
  );
}
