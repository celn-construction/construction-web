'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import { Menu } from '@bryntum/gantt';
import '@bryntum/gantt/gantt.css';
import { Box } from '@mui/material';
import { api } from '@/trpc/react';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import { canManageProjects } from '@/lib/permissions';
import { createGanttConfig } from './config/ganttConfig';
import GanttToolbar from './components/GanttToolbar';
import { TaskDetailsPopover } from './components/TaskDetailsPopover';
import ConflictDialog from './components/ConflictDialog';
import TaskInfoDialog from './components/TaskInfoDialog';
import { useBryntumThemeAssets } from './hooks/useBryntumThemeAssets';
import { useTaskPopover } from './hooks/useTaskPopover';
import { useGanttControls } from './hooks/useGanttControls';
import { useGanttDraft, hasGanttDraft } from './hooks/useGanttDraft';
import { injectTaskVersions } from './utils/injectTaskVersions';
import { reconcileSyncPack } from './utils/reconcileSyncPack';
import type { BryntumTaskRecord, BryntumGanttInstance } from './types';
import GanttLoadingSpinner from './components/GanttLoadingSpinner';

const WRAPPER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: '12px',
  backgroundColor: 'var(--bg-card)',
  overflow: 'clip',
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
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    enableStm,
  } = ganttControls;

  const errorColor = '#D93C15';
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [taskInfoRecord, setTaskInfoRecord] = useState<BryntumTaskRecord | null>(null);

  // Lock mode: chart is locked by default; admin-level users can unlock to edit.
  // If a localStorage draft is present we start unlocked — the user has unsaved
  // work and clearly wants to keep editing rather than click a toggle first.
  const { currentOrg } = useOrgFromUrl();
  const canEditChart = canManageProjects(currentOrg?.role ?? '');
  const [isEditMode, setIsEditMode] = useState(() => hasGanttDraft(projectId));
  const editingUnlocked = canEditChart && isEditMode;

  const isReloadingRef = useRef(false);
  const skipVersionRef = useRef(false);

  // Bryntum's CrudManager "added"/"removed" bags can drop records when the
  // scheduling engine commits state between cycles (see force-sync comment below).
  // We shadow-track IDs from the reliable taskStore events so `onBeforeSync` can
  // reconcile the outgoing pack. `lastSync*` captures what was sent so we only
  // clear those IDs on a successful sync (new changes during the request stay).
  const pendingAddedIdsRef = useRef<Set<string>>(new Set());
  const pendingRemovedIdsRef = useRef<Set<string>>(new Set());
  const lastSyncAddedIdsRef = useRef<Set<string>>(new Set());
  const lastSyncRemovedIdsRef = useRef<Set<string>>(new Set());

  const { selectedTask, popoverPlacement, handleTaskClick, closeTaskPopover, isTaskPopoverOpen } =
    useTaskPopover();

  useBryntumThemeAssets();

  useGanttDraft({
    getGanttInstance,
    projectId,
    isLoading,
  });

  // Sync Bryntum's built-in readOnly flag with our edit-mode state.
  // This disables cell editing, task drag, task resize, and dependency creation.
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    gantt.readOnly = !editingUnlocked;
  }, [isLoading, getGanttInstance, editingUnlocked]);

  // After data loads, finalize the project so the scheduling engine is ready.
  // delayCalculation defers the initial engine run — commitAsync triggers it.
  // Then enable STM so undo/redo starts tracking from this clean state.
  // Do NOT call scrollToDate here — it corrupts the time axis header.
  const stmCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void gantt.project.commitAsync().then(() => {
      stmCleanupRef.current = enableStm();
    });
    return () => {
      stmCleanupRef.current?.();
      stmCleanupRef.current = null;
    };
  }, [isLoading, getGanttInstance, enableStm]);

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
      // Clear only the IDs that were actually sent in this sync cycle; any IDs
      // added to pending* after `onBeforeSync` fired belong to the next sync.
      for (const id of lastSyncAddedIdsRef.current) pendingAddedIdsRef.current.delete(id);
      for (const id of lastSyncRemovedIdsRef.current) pendingRemovedIdsRef.current.delete(id);
      lastSyncAddedIdsRef.current.clear();
      lastSyncRemovedIdsRef.current.clear();
      void utils.gantt.tasks.invalidate();
    };

    const onSyncFail = () => {
      skipVersionRef.current = false;
      // Keep pending IDs intact for retry; just drop the in-flight snapshot.
      lastSyncAddedIdsRef.current.clear();
      lastSyncRemovedIdsRef.current.clear();
    };

    // Engine-cascaded records (successor recalculations) are intentionally NOT
    // injected — they skip the version check.
    const onBeforeSync = ({ pack }: { pack: unknown }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const taskStore = gantt.project.taskStore;
      reconcileSyncPack(
        pack,
        taskStore as Parameters<typeof reconcileSyncPack>[1],
        pendingAddedIdsRef.current,
        pendingRemovedIdsRef.current,
      );

      // Snapshot IDs actually being sent so `onSync` can clear only these on success,
      // without dropping new changes that arrive mid-request.
      lastSyncAddedIdsRef.current = new Set(pendingAddedIdsRef.current);
      lastSyncRemovedIdsRef.current = new Set(pendingRemovedIdsRef.current);

      // When user clicks "Proceed" after a conflict, skip version injection
      // so the server does a last-write-wins save (no version check).
      if (skipVersionRef.current) return;
      injectTaskVersions(pack, taskStore as Parameters<typeof injectTaskVersions>[1]);
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
        for (const t of tasks) pendingAddedIdsRef.current.add(t.id);
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
        for (const t of tasks) {
          // If added then removed before sync, the two cancel out. Otherwise track
          // the removal so we can reconcile the pack if Bryntum drops it.
          if (pendingAddedIdsRef.current.has(t.id)) {
            pendingAddedIdsRef.current.delete(t.id);
          } else {
            pendingRemovedIdsRef.current.add(t.id);
          }
        }
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
  // We read ALL data from Bryntum's stores via project.toJSON() instead of relying
  // on project.sync(), because Bryntum's scheduling engine internally commits store
  // dirty state during deferred calculations — causing records added between engine
  // cycles to fall out of the CrudManager's "added" bag and never sync to the server.
  // Reading inlineData/toJSON captures ALL records regardless of dirty tracking.
  useEffect(() => {
    const handleForceSync = () => {
      const gantt = getGanttInstance();
      if (!gantt?.project) {
        window.dispatchEvent(new CustomEvent('gantt-sync-done', { detail: { inlineData: null } }));
        return;
      }

      void (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await gantt.project.commitAsync();

          // 2. Read ALL data from Bryntum's individual stores and serialize to plain objects.
          //    We can't use project.inlineData directly because it contains Bryntum record
          //    instances with circular parent↔children references that break JSON serialization.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const taskStore = gantt.project.taskStore;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const allTasks = (taskStore?.allRecords as Array<{ isRoot?: boolean; toJSON?: () => Record<string, unknown>; data?: Record<string, unknown> }>) ?? [];
          // Pick only DB-relevant fields. Do NOT use toJSON() — it includes
          // `children` arrays (tree structure) that create massive nested duplicates.
          const pickTaskFields = (r: Record<string, unknown>) => ({
            id: r.id, name: r.name, parentId: r.parentId ?? null,
            startDate: r.startDate, endDate: r.endDate,
            duration: r.duration, durationUnit: r.durationUnit,
            percentDone: r.percentDone, effort: r.effort, effortUnit: r.effortUnit,
            expanded: r.expanded, manuallyScheduled: r.manuallyScheduled,
            constraintType: r.constraintType, constraintDate: r.constraintDate,
            rollup: r.rollup, cls: r.cls, iconCls: r.iconCls,
            note: r.note, csiCode: r.csiCode, baselines: r.baselines,
            orderIndex: r.parentIndex ?? r.orderedParentIndex, version: r.version,
          });
          const serializedTasks = allTasks
            .filter(r => !r.isRoot)
            .map(r => pickTaskFields(r.data ?? r as unknown as Record<string, unknown>));

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const depStore = gantt.project.dependencyStore;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const allDeps = (depStore?.allRecords as Array<{ toJSON?: () => Record<string, unknown>; data?: Record<string, unknown> }>) ?? [];
          const pickFields = (r: { data?: Record<string, unknown> }) => ({ ...(r.data ?? r) });
          const serializedDeps = allDeps.map(pickFields);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const resStore = gantt.project.resourceStore;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const allResources = (resStore?.allRecords as Array<{ data?: Record<string, unknown> }>) ?? [];
          const serializedResources = allResources.map(pickFields);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const assignStore = gantt.project.assignmentStore;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const allAssignments = (assignStore?.allRecords as Array<{ data?: Record<string, unknown> }>) ?? [];
          const serializedAssignments = allAssignments.map(pickFields);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const trStore = gantt.project.timeRangeStore;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const allTimeRanges = (trStore?.allRecords as Array<{ data?: Record<string, unknown> }>) ?? [];
          const serializedTimeRanges = allTimeRanges.map(pickFields);

          // JSON round-trip to strip any remaining class instances, circular refs,
          // or non-serializable values (Dates become ISO strings, etc.)
          let inlineData: Record<string, unknown>;
          try {
            inlineData = JSON.parse(JSON.stringify({
              tasks: serializedTasks,
              dependencies: serializedDeps,
              resources: serializedResources,
              assignments: serializedAssignments,
              timeRanges: serializedTimeRanges,
            })) as Record<string, unknown>;
          } catch (jsonErr) {
            console.error('[ForceSync] JSON serialization failed:', jsonErr);
            inlineData = { tasks: [], dependencies: [], resources: [], assignments: [], timeRanges: [] };
          }

          // 3. Also attempt CrudManager sync for best-effort DB persistence
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          if (gantt.project.crudStoreHasChanges()) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              await gantt.project.sync();
            } catch {
              // Non-fatal — the inlineData snapshot will still have all data
            }
          }
          window.dispatchEvent(new CustomEvent('gantt-sync-done', { detail: { inlineData } }));
        } catch {
          window.dispatchEvent(new CustomEvent('gantt-sync-done', { detail: { inlineData: null } }));
        }
      })();
    };
    window.addEventListener('gantt-force-sync', handleForceSync);
    return () => window.removeEventListener('gantt-force-sync', handleForceSync);
  }, [getGanttInstance]);

  // Keyboard shortcuts for undo/redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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

  // Open task info dialog on double-click of a task bar (replaces Bryntum's built-in task editor).
  // Only attach the listener when editing is unlocked — the dialog is an edit surface.
  useEffect(() => {
    if (isLoading) return;
    if (!editingUnlocked) return;
    const gantt = getGanttInstance();
    if (!gantt) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const detach = gantt.on('taskDblClick', ({ taskRecord }: { taskRecord: unknown }) => {
      closeTaskPopover();
      setTaskInfoRecord(taskRecord as BryntumTaskRecord);
    }) as (() => void) | undefined;
    return () => { detach?.(); };
  }, [isLoading, getGanttInstance, closeTaskPopover, editingUnlocked]);

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

      // Scroll-to-task button — centers the timeline on the task's start date.
      // NOTE: scrollTaskIntoView corrupts the time axis header virtual renderer,
      // so we use the timeAxis subgrid's scrollable to scroll horizontally instead.
      const scrollBtn = target.closest('.gantt-row-scroll-btn') as HTMLElement | null;
      if (scrollBtn && column.type === 'name') {
        event.stopPropagation();
        const taskRecord = record as BryntumTaskRecord;
        const startDate = taskRecord.startDate as Date | undefined;
        if (startDate) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
          (gantt as any).scrollToDate(startDate, { block: 'center', animate: 300 });
        }
        return;
      }

      const btn = target.closest('.gantt-row-actions-btn') as HTMLElement | null;
      if (!btn || column.type !== 'name') return;

      event.stopPropagation();

      // Row action menu contains write actions (add subtask, indent, delete, …) —
      // don't open it when the chart is locked.
      if (!editingUnlocked) return;

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
  }, [isLoading, getGanttInstance, closeTaskPopover, editingUnlocked]);

  // Close any open row-action menu the moment the chart is locked.
  useEffect(() => {
    if (editingUnlocked) return;
    if (activeMenuRef.current) {
      activeMenuRef.current.destroy();
      activeMenuRef.current = null;
    }
  }, [editingUnlocked]);

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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        canEditChart={canEditChart}
        isEditMode={editingUnlocked}
        onToggleEditMode={() => setIsEditMode((prev) => !prev)}
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
        /* Hide mutation affordances while the chart is locked. */
        .bryntum-gantt-container[data-locked="true"] .gantt-row-actions-btn {
          display: none;
        }
        /* Scroll-to-task button — left of the ⋮ button, uses FA crosshairs icon */
        .gantt-row-scroll-btn {
          flex-shrink: 0;
          background: none;
          border: none;
          box-shadow: none;
          min-width: 0;
          padding: 4px 4px;
          cursor: pointer;
          border-radius: 4px;
          color: var(--text-secondary, #8D99AE);
          font-size: 13px;
          line-height: 1;
        }
        .gantt-row-scroll-btn:hover {
          background: rgba(0, 0, 0, 0.04);
          color: var(--text-primary, #2B2D42);
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

      <div
        style={GANTT_CONTENT_STYLE}
        className="bryntum-gantt-container"
        data-locked={editingUnlocked ? 'false' : 'true'}
      >
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
