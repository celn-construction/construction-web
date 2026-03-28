'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
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
import dynamic from 'next/dynamic';
import { ChannelProvider } from 'ably/react';
import { useGanttRealtime } from './hooks/useGanttRealtime';
import GanttPresence from './components/GanttPresence';
import GanttLoadingSpinner from './components/GanttLoadingSpinner';

// Dynamic import so Ably SDK is only loaded when realtime is enabled.
// Renders null while loading — no DOM disruption to siblings.
const AblyProviderLazy = dynamic(() => import('@/components/providers/AblyProvider'), { ssr: false });

type PresenceData = Array<{
  clientId: string;
  data?: { name?: string; avatar?: string; joinedAt?: number };
}>;

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
  userId?: string;
  userName?: string;
  userAvatar?: string;
  realtimeEnabled?: boolean;
}

interface BryntumGanttCoreProps extends BryntumGanttWrapperProps {
  ganttControls: ReturnType<typeof useGanttControls>;
  isApplyingRemoteRef: React.MutableRefObject<boolean>;
  presenceData: PresenceData;
}

// ─── Realtime listener — runs inside ChannelProvider, NEVER wraps the Gantt ──

function RealtimeListener({
  projectId,
  userId,
  userName,
  userAvatar,
  getGanttInstance,
  onStateChange,
}: {
  projectId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getGanttInstance: () => any;
  onStateChange: (state: { isApplyingRemoteRef: React.MutableRefObject<boolean>; presenceData: PresenceData }) => void;
}) {
  const { isApplyingRemoteRef, presenceData } = useGanttRealtime({
    projectId,
    userId,
    userName,
    userAvatar,
    getGanttInstance,
    enabled: !!projectId,
  });

  // Push realtime state up to the parent without re-mounting the Gantt
  useEffect(() => {
    onStateChange({ isApplyingRemoteRef, presenceData });
  }, [isApplyingRemoteRef, presenceData, onStateChange]);

  return null; // No DOM — just hooks
}

// ─── Exported wrapper — BryntumGanttCore is always a sibling, never a child ──

export default function BryntumGanttWrapper(props: BryntumGanttWrapperProps) {
  const ganttControls = useGanttControls();
  const noopRef = useRef(false);

  // TEMPORARY: bypass Ably wrapper to test if the fragment structure
  // is what breaks time axis headers. Render BryntumGanttCore directly.
  return (
    <BryntumGanttCore
      {...props}
      ganttControls={ganttControls}
      isApplyingRemoteRef={noopRef}
      presenceData={[]}
    />
  );
}

// ─── Core — all Gantt state/logic, no Ably hooks ─────────────────────────────

function BryntumGanttCore({ projectId, isVisible = true, userId, userName, userAvatar, realtimeEnabled = false, ganttControls, isApplyingRemoteRef, presenceData }: BryntumGanttCoreProps) {
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

  // After data loads, disable parent task click toggle.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    gantt.toggleParentTasksOnClick = false;
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
      console.log('[Gantt:beforeResponseApply] response keys:', Object.keys(response), 'conflict:', response.conflict);

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

  // Attach the row action menu handler on the Gantt instance.
  // The WidgetColumn menu items use `onItem: 'up.onRowActionClick'` which
  // resolves to this method on the Gantt widget.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (gantt as any).onRowActionClick = ({ source }: { source: { ref: string; up: (type: string) => { cellInfo: { record: unknown } } | null } }) => {
      // Walk up to the button widget to get the cellInfo injected by WidgetColumn
      const button = source.up('button');
      if (!button) return;
      const record = button.cellInfo?.record as BryntumTaskRecord | undefined;
      if (!record) return;
      const g = gantt as unknown as BryntumGanttInstance;

      switch (source.ref) {
        case 'taskDetails':
          closeTaskPopover();
          setTaskInfoRecord(record);
          break;
        case 'addSubtask':
          record.appendChild({ name: 'New Subtask', duration: 1, startDate: new Date() });
          // Expand the parent so the new subtask is visible
          if (!record.isExpanded) {
            g.expand(record);
          }
          break;
        case 'indent':
          g.indent([record]);
          break;
        case 'outdent':
          g.outdent([record]);
          break;
        case 'unlinkTask': {
          // Remove all dependencies (both incoming and outgoing) for this task
          const deps = [
            ...(record.predecessors ?? []),
            ...(record.successors ?? []),
          ];
          if (deps.length > 0) g.dependencyStore.remove(deps);
          break;
        }
        case 'deleteTask':
          record.remove();
          break;
      }
    };

    return () => {
      const g = getGanttInstance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      if (g) delete (g as any).onRowActionClick;
    };
  }, [isLoading, getGanttInstance]);

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
        presenceSlot={
          realtimeEnabled && userId ? (
            <GanttPresence currentUserId={userId} presenceData={presenceData} />
          ) : undefined
        }
      />

      {/* Bryntum must always render in a visible container so its internal layout
          calculations use real dimensions.  The loading/error overlays sit on top. */}
      <style>{`
        .bryntum-gantt-container .b-tree-cell { cursor: pointer; }
        .bryntum-gantt-container .b-gantt-task.b-task-selected {
          outline: 2.5px solid rgba(43, 45, 66, 0.85) !important;
          outline-offset: 2px;
        }
        /* Row actions ⋮ button */
        .gantt-row-actions-btn {
          opacity: 0.4;
          transition: opacity 0.15s;
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          min-width: 0 !important;
        }
        .b-grid-row:hover .gantt-row-actions-btn,
        .gantt-row-actions-btn:focus,
        .gantt-row-actions-btn[aria-expanded="true"] {
          opacity: 1;
        }
        /* Row actions dropdown menu — clean card style */
        .gantt-row-actions-btn + .b-menu,
        .b-menu:has(.gantt-action-danger) {
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08)) !important;
          padding: 4px 0 !important;
          overflow: hidden;
        }
        .gantt-row-actions-btn + .b-menu .b-menuitem,
        .b-menu:has(.gantt-action-danger) .b-menuitem {
          padding: 8px 16px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          border-radius: 0 !important;
          gap: 10px !important;
        }
        .gantt-row-actions-btn + .b-menu .b-menuitem:hover,
        .b-menu:has(.gantt-action-danger) .b-menuitem:hover {
          background: var(--hover-bg, rgba(0, 0, 0, 0.04)) !important;
        }
        .gantt-row-actions-btn + .b-menu .b-menuitem .b-icon,
        .b-menu:has(.gantt-action-danger) .b-menuitem .b-icon {
          font-size: 14px !important;
          width: 18px !important;
          text-align: center;
        }
        .gantt-row-actions-btn + .b-menu .b-menu-separator,
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
