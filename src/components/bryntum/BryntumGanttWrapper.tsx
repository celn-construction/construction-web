'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { CircularProgress, Box } from '@mui/material';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/trpc/react';
import { createGanttConfig } from './config/ganttConfig';
import GanttToolbar from './components/GanttToolbar';
import { TaskDetailsPopover } from './components/TaskDetailsPopover';
import ConflictDialog from './components/ConflictDialog';
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
  boxShadow: 'var(--gantt-container-shadow)',
  overflow: 'hidden',
};

const GANTT_CONTENT_STYLE: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'clip',
};

const STALE_THRESHOLD_MS = 60_000; // 60 seconds
// Short settle time so the Bryntum scheduling engine finishes before we sync
const AUTO_SAVE_DELAY_MS = 1_000; // 1 second
const AUTO_SAVE_STORAGE_KEY = 'gantt-autosave-enabled';

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
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(AUTO_SAVE_STORAGE_KEY) !== 'false';
  });
  const [conflictOpen, setConflictOpen] = useState(false);

  const justSavedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Refs so timer callbacks always read fresh state without stale closures
  const isSavingRef = useRef(false);
  const autoSaveEnabledRef = useRef(autoSaveEnabled);
  const isRevertingRef = useRef(false);
  // Guards against spurious auto-save when stores change during a conflict reload
  const isReloadingRef = useRef(false);
  // Guards against spurious hasPendingChanges when Bryntum writes server response back to stores
  const isSyncingRef = useRef(false);
  // When true, beforeSync skips version injection so the save goes through without version check
  const skipVersionRef = useRef(false);

  useEffect(() => { isSavingRef.current = isSaving; }, [isSaving]);
  useEffect(() => { autoSaveEnabledRef.current = autoSaveEnabled; }, [autoSaveEnabled]);

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

  // After data loads, disable parent task click toggle.
  // delayCalculation was removed from the project config so the engine
  // calculates immediately — no commitAsync needed here.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    gantt.toggleParentTasksOnClick = false;
  }, [isLoading, getGanttInstance]);

  const handleSave = useCallback(async () => {
    const gantt = getGanttInstance();
    if (!gantt?.project) return;
    // Bryntum returns null from .changes when there's nothing to sync.
    // Calling sync() with no dirty records skips the HTTP request entirely and
    // fires neither 'sync' nor 'syncFail', so isSaving would never reset.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const changes = gantt.project.changes as unknown;
    if (!changes) {
      console.log('[Gantt:handleSave] No Bryntum changes to sync — resetting hasPendingChanges');
      setHasPendingChanges(false);
      return;
    }
    console.log('[Gantt:handleSave] Starting sync, autoSave:', autoSaveEnabledRef.current, 'changes:', JSON.stringify(changes));
    setIsSaving(true);
    await gantt.project.sync();
    // isSaving and hasPendingChanges are reset by the sync/syncFail event listeners
  }, [getGanttInstance]);

  const handleToggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => {
      const next = !prev;
      localStorage.setItem(AUTO_SAVE_STORAGE_KEY, String(next));
      // Cancel any pending auto-save when turning off
      if (!next) clearTimeout(autoSaveTimerRef.current);
      return next;
    });
  }, []);

  // Invalidate tRPC cache when Bryntum syncs so sibling components (e.g. file tree) refetch
  const utils = api.useUtils();
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt?.project) return;

    // Detect version conflicts BEFORE Bryntum applies the response data.
    // `beforeResponseApply` is the only CrudManager event that passes the decoded
    // response object for sync requests. The `sync` event does NOT include it.
    // Returning false prevents Bryntum from applying the empty conflict response.
    const onBeforeResponseApply = ({ requestType, response }: { requestType: string; response: Record<string, unknown> }) => {
      if (requestType !== 'sync') return;
      console.log('[Gantt:beforeResponseApply] response keys:', Object.keys(response), 'conflict:', response.conflict);

      if (response.conflict) {
        console.log('[Gantt:beforeResponseApply] CONFLICT detected');
        setIsSaving(false);

        // Manually clear Bryntum's "Saving changes, please wait..." mask
        // since returning false prevents the sync cycle from finalizing.
        const g = getGanttInstance();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (g) (g as unknown as { unmask?: () => void }).unmask?.();

        setConflictOpen(true);
        return false; // Keep records dirty so "Keep My Changes" can re-sync them
      }
    };

    const onSync = () => {
      console.log('[Gantt:onSync] Sync succeeded, skipVersion was:', skipVersionRef.current);
      skipVersionRef.current = false;
      // Block store 'change' events fired when Bryntum writes server response
      // data (e.g. new version numbers) back into its stores — those are not
      // user edits and must not re-arm hasPendingChanges.
      isSyncingRef.current = true;
      clearTimeout(autoSaveTimerRef.current);
      setIsSaving(false);
      setHasPendingChanges(false);
      setJustSaved(true);
      clearTimeout(justSavedTimerRef.current);
      justSavedTimerRef.current = setTimeout(() => setJustSaved(false), 2000);
      void utils.gantt.tasks.invalidate();
      // Clear the guard after the microtask queue drains so all synchronous
      // store updates from the sync response are suppressed.
      setTimeout(() => { isSyncingRef.current = false; }, 0);
    };

    const onSyncFail = () => {
      setIsSaving(false);
      skipVersionRef.current = false;
      // For non-conflict errors, hasPendingChanges stays true so user can retry
    };

    // Inject version into sync payload for optimistic locking.
    // Bryntum only sends changed fields; version is never edited by users so we must
    // manually inject it for each updated record. Engine-cascaded records (successor
    // recalculations) are intentionally NOT injected — they skip the version check.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onBeforeSync = ({ pack }: { pack: any }) => {
      console.log('[Gantt:beforeSync] FIRED — skipVersion:', skipVersionRef.current, 'pack keys:', Object.keys(pack as object));

      // When user clicks "Proceed" after a conflict, skip version injection
      // so the server does a last-write-wins save (no version check).
      if (skipVersionRef.current) {
        console.log('[Gantt:beforeSync] Skipping version injection (force save)');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const taskChanges = pack?.tasks as { updated?: Array<Record<string, unknown>> } | undefined;
      console.log('[Gantt:beforeSync] taskChanges:', taskChanges ? `updated: ${taskChanges.updated?.length ?? 0}` : 'none');
      if (taskChanges?.updated) {
        for (const task of taskChanges.updated) {
          console.log('[Gantt:beforeSync] Task in pack:', task.id, 'typeof id:', typeof task.id, 'existing version in pack:', task.version);
          if (task.id && typeof task.id === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const record = gantt.project.taskStore.getById(task.id) as { get?: (field: string) => unknown; data?: Record<string, unknown> } | null;
            console.log('[Gantt:beforeSync] Record found:', !!record, 'has get:', !!record?.get);
            if (record?.get) {
              const version = record.get('version');
              console.log('[Gantt:beforeSync] Task', task.id, '→ store version:', version, 'typeof:', typeof version);
              if (typeof version === 'number') {
                task.version = version;
                console.log('[Gantt:beforeSync] Task', task.id, '→ INJECTED version:', version);
              } else {
                console.warn('[Gantt:beforeSync] Task', task.id, '→ version NOT a number, skipping injection. record.data:', JSON.stringify(record.data));
              }
            }
          }
        }
      }
    };

    gantt.project.on('beforeResponseApply', onBeforeResponseApply);
    gantt.project.on('sync', onSync);
    gantt.project.on('syncFail', onSyncFail);
    gantt.project.on('beforeSync', onBeforeSync);
    return () => {
      gantt.project?.un('beforeResponseApply', onBeforeResponseApply);
      gantt.project?.un('sync', onSync);
      gantt.project?.un('syncFail', onSyncFail);
      gantt.project?.un('beforeSync', onBeforeSync);
      clearTimeout(justSavedTimerRef.current);
    };
  }, [isLoading, getGanttInstance, utils]);

  // Mark pending changes when any store is modified locally.
  // When auto-save is enabled, schedule a save shortly after each change so the
  // Bryntum scheduling engine has time to settle before we sync.
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

    const onStoreChange = () => {
      // Skip store changes triggered by a conflict reload or by Bryntum writing
      // server response data back into its stores after a successful sync.
      if (isReloadingRef.current || isSyncingRef.current) {
        console.log('[Gantt:onStoreChange] Suppressed (reloading:', isReloadingRef.current, 'syncing:', isSyncingRef.current, ')');
        return;
      }
      console.log('[Gantt:onStoreChange] Change detected, autoSave:', autoSaveEnabledRef.current, 'isSaving:', isSavingRef.current);
      setHasPendingChanges(true);
      if (!autoSaveEnabledRef.current) return;
      // Debounce so rapid successive engine updates collapse into one sync call
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        if (!isSavingRef.current) {
          console.log('[Gantt:autoSave] Debounce fired — triggering save');
          void handleSave();
        } else {
          console.log('[Gantt:autoSave] Debounce fired — skipped (save already in flight)');
        }
      }, AUTO_SAVE_DELAY_MS);
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stores.forEach(store => store?.on('change', onStoreChange));
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stores.forEach(store => store?.un('change', onStoreChange));
      clearTimeout(autoSaveTimerRef.current);
    };
  }, [isLoading, getGanttInstance, handleSave]);

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

  const handleConflictProceed = useCallback(() => {
    setConflictOpen(false);
    skipVersionRef.current = true;
    void handleSave();
  }, [handleSave]);

  const handleConflictRefresh = useCallback(() => {
    setConflictOpen(false);
    isReloadingRef.current = true;
    const g = getGanttInstance();
    if (g?.project) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      void g.project.load().finally(() => { isReloadingRef.current = false; });
    } else {
      isReloadingRef.current = false;
    }
  }, [getGanttInstance]);

  // Attach the taskClick listener on the Bryntum instance (not in the static config)
  // so we can use the latest handleTaskClick reference from useTaskPopover.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const detach = gantt.on('taskClick', handleTaskClick) as (() => void) | undefined;
    return () => { detach?.(); };
  }, [isLoading, getGanttInstance, handleTaskClick]);

  return (
    <div style={WRAPPER_STYLE}>
      <GanttToolbar
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
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={handleToggleAutoSave}
      />

      {/* Bryntum must always render in a visible container so its internal layout
          calculations use real dimensions.  The loading/error overlays sit on top. */}
      <style>{`
        .bryntum-gantt-container .b-tree-cell { cursor: pointer; }
        .bryntum-gantt-container .b-gantt-task.b-highlight {
          animation: gantt-bar-glow 0.8s ease-out !important;
          outline: none !important;
        }
        @keyframes gantt-bar-glow {
          0% { box-shadow: 0 0 0 3px rgba(43, 45, 66, 0.2), var(--gantt-task-shadow); }
          100% { box-shadow: var(--gantt-task-shadow); }
        }
      `}</style>

      <div style={GANTT_CONTENT_STYLE} className="bryntum-gantt-container">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <BryntumGantt ref={ganttRef} {...ganttConfig} />
        </div>

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

      <ConflictDialog
        open={conflictOpen}
        onProceed={handleConflictProceed}
        onRefresh={handleConflictRefresh}
      />
    </div>
  );
}
