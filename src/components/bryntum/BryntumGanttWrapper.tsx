'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import { Menu } from '@bryntum/gantt';
import '@bryntum/gantt/gantt.css';
import { Box } from '@mui/material';
import { api } from '@/trpc/react';
import { createGanttConfig } from './config/ganttConfig';
import GanttToolbar from './components/GanttToolbar';
import { TaskDetailsPopover } from './components/TaskDetailsPopover';
import ConflictDialog from './components/ConflictDialog';
import TaskInfoDialog from './components/TaskInfoDialog';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useBryntumThemeAssets } from './hooks/useBryntumThemeAssets';
import { useTaskPopover } from './hooks/useTaskPopover';
import { useGanttControls } from './hooks/useGanttControls';
import type { BryntumTaskRecord, BryntumGanttInstance } from './types';
import { validateParentDuration } from './utils/ganttValidation';
import GanttLoadingSpinner from './components/GanttLoadingSpinner';

const WRAPPER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-card)',
  boxShadow: 'var(--gantt-container-ring), var(--gantt-container-shadow)',
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

export default function BryntumGanttWrapper(props: BryntumGanttWrapperProps) {
  const ganttControls = useGanttControls();

  return <BryntumGanttCore {...props} ganttControls={ganttControls} />;
}

function BryntumGanttCore({ projectId, isVisible = true, ganttControls }: BryntumGanttWrapperProps & { ganttControls: ReturnType<typeof useGanttControls> }) {
  const {
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
  } = ganttControls;

  const errorColor = '#D93C15';
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [taskInfoRecord, setTaskInfoRecord] = useState<BryntumTaskRecord | null>(null);

  const isRevertingRef = useRef(false);
  const isReloadingRef = useRef(false);
  const skipVersionRef = useRef(false);

  const { showSnackbar } = useSnackbar();

  const { selectedTask, popoverPlacement, handleTaskClick, closeTaskPopover, isTaskPopoverOpen } =
    useTaskPopover();

  useBryntumThemeAssets();

  // After data loads, finalize the project so the scheduling engine is ready.
  // delayCalculation defers the initial engine run — commitAsync triggers it.
  // Do NOT call scrollToDate here — it corrupts the time axis header.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync();
  }, [isLoading, getGanttInstance]);

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
      if (response.conflict) {
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
      skipVersionRef.current = false;
      void utils.gantt.tasks.invalidate();
      // Sync complete — store events already tracked the changes
    };

    const onSyncFail = () => {
      skipVersionRef.current = false;
    };

    // Inject version into sync payload for optimistic locking.
    // Bryntum only sends changed fields; version is never edited by users so we must
    // manually inject it for each updated record. Engine-cascaded records (successor
    // recalculations) are intentionally NOT injected — they skip the version check.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onBeforeSync = ({ pack }: { pack: any }) => {
      // When user clicks "Proceed" after a conflict, skip version injection
      // so the server does a last-write-wins save (no version check).
      if (skipVersionRef.current) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const taskChanges = pack?.tasks as { updated?: Array<Record<string, unknown>> } | undefined;
      if (taskChanges?.updated) {
        for (const task of taskChanges.updated) {
          if (task.id && typeof task.id === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const record = gantt.project.taskStore.getById(task.id) as { get?: (field: string) => unknown; data?: Record<string, unknown> } | null;
            if (record?.get) {
              const version = record.get('version');
              if (typeof version === 'number') {
                task.version = version;
              }
            }
          }
        }
      }
    };

    // Track changes via direct store events (add/remove/update).
    // These fire synchronously BEFORE auto-sync, so they're reliable.
    // We dispatch individual change events; the ganttChangesStore accumulates them.
    const taskStore = gantt.project.taskStore;

    const onTaskAdd = ({ records, isExpand }: { records: Array<{ id?: string; name?: string; isRoot?: boolean }>; isExpand?: boolean }) => {
      // Skip expand/collapse visibility changes — these are not real additions
      if (isExpand) return;
      const tasks = records
        .filter((r) => !r.isRoot && r.id)
        .map((r) => ({ id: String(r.id), name: r.name ?? 'New Task' }));
      if (tasks.length > 0) {
        window.dispatchEvent(new CustomEvent('gantt-task-change', {
          detail: { type: 'add', tasks },
        }));
      }
    };

    const onTaskRemove = ({ records, isCollapse }: { records: Array<{ id?: string; name?: string; isRoot?: boolean }>; isCollapse?: boolean }) => {
      // Skip expand/collapse visibility changes — these are not real removals
      if (isCollapse) return;
      const tasks = records
        .filter((r) => !r.isRoot && r.id)
        .map((r) => ({ id: String(r.id), name: r.name ?? 'Task' }));
      if (tasks.length > 0) {
        window.dispatchEvent(new CustomEvent('gantt-task-change', {
          detail: { type: 'remove', tasks },
        }));
      }
    };

    // Track updates only for user-initiated field changes (name, note, csiCode),
    // NOT scheduling engine recalculations (dates, duration, percentDone, etc.)
    const userEditableFields = new Set(['name', 'note', 'csiCode', 'manuallyScheduled']);
    const onTaskUpdate = ({ record, changes }: { record: { id?: string; name?: string; isRoot?: boolean }; changes: Record<string, unknown> }) => {
      if (record.isRoot || !record.id) return;
      const userChanges = Object.keys(changes).filter((k) => userEditableFields.has(k));
      if (userChanges.length > 0) {
        window.dispatchEvent(new CustomEvent('gantt-task-change', {
          detail: { type: 'update', tasks: [{ id: String(record.id), name: record.name ?? 'Task' }] },
        }));
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    taskStore.on('add', onTaskAdd);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    taskStore.on('remove', onTaskRemove);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    taskStore.on('update', onTaskUpdate);

    gantt.project.on('beforeResponseApply', onBeforeResponseApply);
    gantt.project.on('sync', onSync);
    gantt.project.on('syncFail', onSyncFail);
    gantt.project.on('beforeSync', onBeforeSync);
    return () => {
      gantt.project?.un('beforeResponseApply', onBeforeResponseApply);
      gantt.project?.un('sync', onSync);
      gantt.project?.un('syncFail', onSyncFail);
      gantt.project?.un('beforeSync', onBeforeSync);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.project?.taskStore?.un('add', onTaskAdd);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.project?.taskStore?.un('remove', onTaskRemove);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gantt.project?.taskStore?.un('update', onTaskUpdate);
    };
  }, [isLoading, getGanttInstance, utils]);

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
    const g = getGanttInstance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (g?.project) void g.project.sync();
  }, [getGanttInstance]);

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

  // Listen for force-sync requests (e.g. before saving a version).
  // Per Bryntum docs: commitAsync() ensures the scheduling engine finishes calculating,
  // then sync() persists all pending CRUD changes. sync() queues if one is already in-flight.
  // We loop until crudStoreHasChanges() returns false (max 3 attempts) to handle the case
  // where new changes appear during an in-flight sync.
  useEffect(() => {
    const handleForceSync = () => {
      const gantt = getGanttInstance();
      if (!gantt?.project) {
        window.dispatchEvent(new Event('gantt-sync-done'));
        return;
      }

      const syncUntilClean = async (attempt = 1): Promise<void> => {
        const MAX_ATTEMPTS = 3;

        // 1. Commit pending scheduling engine calculations
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await gantt.project.commitAsync();

        // 2. Check if there are CRUD changes to persist
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const dirty = gantt.project.crudStoreHasChanges() as boolean;

        if (!dirty) {
          return;
        }

        // 3. Sync — this queues behind any in-flight sync per Bryntum docs
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await gantt.project.sync();

        // 4. Check again — new changes may have appeared during in-flight sync
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const stillDirty = gantt.project.crudStoreHasChanges() as boolean;
        if (stillDirty && attempt < MAX_ATTEMPTS) {
          return syncUntilClean(attempt + 1);
        }
      };

      void syncUntilClean().then(() => {
        window.dispatchEvent(new Event('gantt-sync-done'));
      }).catch(() => {
        window.dispatchEvent(new Event('gantt-sync-done'));
      });
    };
    window.addEventListener('gantt-force-sync', handleForceSync);
    return () => window.removeEventListener('gantt-force-sync', handleForceSync);
  }, [getGanttInstance]);

  // Listen for external reload requests (e.g. after restoring a version)
  useEffect(() => {
    const handleReload = () => {
      const gantt = getGanttInstance();
      if (gantt?.project) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        void gantt.project.load();
      }
    };
    window.addEventListener('gantt-reload', handleReload);
    return () => window.removeEventListener('gantt-reload', handleReload);
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

  // Open task info dialog on double-click of a task bar (replaces Bryntum's built-in task editor)
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const detach = gantt.on('taskDblClick', ({ taskRecord }: { taskRecord: unknown }) => {
      closeTaskPopover();
      setTaskInfoRecord(taskRecord as BryntumTaskRecord);
    }) as (() => void) | undefined;
    return () => { detach?.(); };
  }, [isLoading, getGanttInstance, closeTaskPopover]);

  // Row action menu — detect clicks on the ⋮ button injected by the name column
  // renderer, then show a programmatic Bryntum Menu at the button position.
  const activeMenuRef = useRef<{ destroy: () => void } | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onCellClick = ({ record, column, event }: { record: any; column: { type: string }; event: MouseEvent }) => {
      const target = event.target as HTMLElement;
      const btn = target.closest('.gantt-row-actions-btn') as HTMLElement | null;
      if (!btn || column.type !== 'name') return;

      event.stopPropagation();

      // Destroy any previously open menu
      if (activeMenuRef.current) {
        activeMenuRef.current.destroy();
        activeMenuRef.current = null;
      }

      const taskRecord = record as BryntumTaskRecord;
      const g = gantt as unknown as BryntumGanttInstance;

      btn.classList.add('gantt-menu-open');

      activeMenuRef.current = new Menu({
        forElement: btn,
        align: 't-b',
        items: [
          {
            ref: 'taskDetails',
            text: 'Task Details',
            icon: 'b-icon b-icon-edit',
            onItem: () => { closeTaskPopover(); setTaskInfoRecord(taskRecord); },
          },
          {
            ref: 'addSubtask',
            text: 'Add Subtask',
            icon: 'b-icon b-icon-add',
            onItem: () => {
              taskRecord.appendChild({ name: 'New Subtask', duration: 1, startDate: new Date() });
              if (!taskRecord.isExpanded) g.expand(taskRecord);
            },
          },
          {
            ref: 'indent',
            text: 'Indent',
            icon: 'b-icon b-icon-indent',
            onItem: () => { g.indent([taskRecord]); },
          },
          {
            ref: 'outdent',
            text: 'Outdent',
            icon: 'b-icon b-icon-outdent',
            onItem: () => { g.outdent([taskRecord]); },
          },
          {
            ref: 'unlinkTask',
            text: 'Unlink',
            icon: 'b-icon b-icon-unlink',
            onItem: () => {
              const deps = [...(taskRecord.predecessors ?? []), ...(taskRecord.successors ?? [])];
              if (deps.length > 0) g.dependencyStore.remove(deps);
            },
          },
          {
            ref: 'deleteTask',
            text: 'Delete',
            icon: 'b-icon b-icon-trash',
            cls: 'gantt-action-danger',
            onItem: () => { taskRecord.remove(); },
          },
        ],
        onDestroy: () => {
          btn.classList.remove('gantt-menu-open');
          activeMenuRef.current = null;
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const detach = gantt.on('cellClick', onCellClick) as (() => void) | undefined;
    return () => {
      detach?.();
      if (activeMenuRef.current) {
        activeMenuRef.current.destroy();
        activeMenuRef.current = null;
      }
    };
  }, [isLoading, getGanttInstance, closeTaskPopover]);

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
      />

      {/* Bryntum must always render in a visible container so its internal layout
          calculations use real dimensions.  The loading/error overlays sit on top. */}
      <style>{`
        .bryntum-gantt-container .b-tree-cell { cursor: pointer; }
        .bryntum-gantt-container .b-gantt-task.b-task-selected {
          outline: 2.5px solid rgba(43, 45, 66, 0.85) !important;
          outline-offset: 2px;
        }
        /* Name cell inner wrapper — flex row with name + dots button */
        .gantt-name-cell-inner {
          display: flex;
          align-items: center;
          width: 100%;
          position: relative;
        }
        .gantt-name-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* Row actions ⋮ button — right side of name cell, always visible */
        .gantt-row-actions-btn {
          flex-shrink: 0;
          opacity: 1;
          background: none;
          border: none;
          box-shadow: none;
          min-width: 0;
          padding: 4px 6px;
          cursor: pointer;
          border-radius: 4px;
          color: var(--text-secondary, #8D99AE);
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
          line-height: 1;
        }
        .gantt-row-actions-btn:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        /* Row actions dropdown menu — clean card style */
        .b-menu:has(.gantt-action-danger) {
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08)) !important;
          padding: 4px 0 !important;
          overflow: hidden;
        }
        .b-menu:has(.gantt-action-danger) .b-menuitem {
          padding: 8px 16px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          border-radius: 0 !important;
          gap: 10px !important;
        }
        .b-menu:has(.gantt-action-danger) .b-menuitem:hover {
          background: var(--hover-bg, rgba(0, 0, 0, 0.04)) !important;
        }
        .b-menu:has(.gantt-action-danger) .b-menuitem .b-icon {
          font-size: 14px !important;
          width: 18px !important;
          text-align: center;
        }
        .b-menu:has(.gantt-action-danger) .b-menu-separator {
          margin: 4px 0 !important;
        }
        /* Delete action red text */
        .gantt-action-danger {
          color: ${errorColor} !important;
        }
        .gantt-action-danger .b-icon {
          color: ${errorColor} !important;
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
              bgcolor: 'var(--bg-card)',
              zIndex: 1,
            }}
          >
            <GanttLoadingSpinner />
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

      <TaskInfoDialog
        open={!!taskInfoRecord}
        taskRecord={taskInfoRecord}
        ganttInstance={getGanttInstance() as unknown as import('./types').BryntumGanttInstance | null}
        onClose={() => setTaskInfoRecord(null)}
        onDelete={() => {
          if (taskInfoRecord) taskInfoRecord.remove();
          setTaskInfoRecord(null);
        }}
      />
    </div>
  );
}
