'use client';

import { useRef, useCallback } from 'react';
import { useChannel, usePresence, usePresenceListener } from 'ably/react';
import type Ably from 'ably';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SyncStoreChanges {
  added?: Array<Record<string, unknown>>;
  updated?: Array<Record<string, unknown>>;
  removed?: Array<{ id: string }>;
}

interface SyncResultRows {
  rows: Array<{ $PhantomId?: string; id: string; version?: number }>;
}

interface SyncMessageData {
  userId: string;
  timestamp: number;
  input: {
    tasks?: SyncStoreChanges;
    dependencies?: SyncStoreChanges;
    resources?: SyncStoreChanges;
    assignments?: SyncStoreChanges;
    timeRanges?: SyncStoreChanges;
  };
  result: {
    tasks?: SyncResultRows;
    dependencies?: SyncResultRows;
    resources?: SyncResultRows;
    assignments?: SyncResultRows;
    timeRanges?: SyncResultRows;
  };
}

interface UseGanttRealtimeOptions {
  projectId: string | undefined;
  userId: string;
  userName: string;
  userAvatar?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getGanttInstance: () => any | null;
  enabled: boolean;
}

// ─── Apply Remote Changes ───────────────────────────────────────────────────

/**
 * Apply incoming sync changes from another user to Bryntum's in-memory stores.
 * Handles phantom→real ID mapping, ordering (removals first), and engine commit.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyRemoteChanges(gantt: any, data: SyncMessageData) {
  const { input, result } = data;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const project = gantt.project;
  if (!project) return;

  // Build phantom→real ID map from server result
  const idMap = new Map<string, string>();
  const allResultStores = [result.tasks, result.dependencies, result.resources, result.assignments, result.timeRanges];
  for (const store of allResultStores) {
    for (const row of store?.rows ?? []) {
      if (row.$PhantomId) idMap.set(row.$PhantomId, row.id);
    }
  }

  const resolveId = (id: string | undefined | null): string | null => {
    if (!id) return null;
    return idMap.get(id) ?? id;
  };

  // Suspend auto-sync so remote changes don't trigger a save cycle
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  project.suspendAutoSync?.();

  try {
    // Apply changes for each store type
    const storeMap: Array<{
      storeName: string;
      changes: SyncStoreChanges | undefined;
      resultRows: SyncResultRows | undefined;
    }> = [
      { storeName: 'taskStore', changes: input.tasks, resultRows: result.tasks },
      { storeName: 'dependencyStore', changes: input.dependencies, resultRows: result.dependencies },
      { storeName: 'resourceStore', changes: input.resources, resultRows: result.resources },
      { storeName: 'assignmentStore', changes: input.assignments, resultRows: result.assignments },
      { storeName: 'timeRangeStore', changes: input.timeRanges, resultRows: result.timeRanges },
    ];

    for (const { storeName, changes, resultRows } of storeMap) {
      if (!changes) continue;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const store = project[storeName];
      if (!store) continue;

      // 1. Removals first
      if (changes.removed) {
        for (const { id } of changes.removed) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const record = store.getById(id);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          if (record) store.remove(record);
        }
      }

      // 2. Additions
      if (changes.added) {
        for (const item of changes.added) {
          const phantomId = item.$PhantomId as string | undefined;
          const realId = phantomId ? resolveId(phantomId) : (item.id as string);
          if (!realId) continue;

          // Idempotency check
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          if (store.getById(realId)) continue;

          const addData: Record<string, unknown> = { ...item, id: realId };
          delete addData.$PhantomId;

          // Resolve parent ID for tasks
          if ('parentId' in addData && addData.parentId) {
            addData.parentId = resolveId(addData.parentId as string);
          }
          // Resolve task/resource refs for dependencies and assignments
          if ('fromTask' in addData && addData.fromTask) addData.fromTask = resolveId(addData.fromTask as string);
          if ('toTask' in addData && addData.toTask) addData.toTask = resolveId(addData.toTask as string);
          if ('fromTaskId' in addData && addData.fromTaskId) addData.fromTaskId = resolveId(addData.fromTaskId as string);
          if ('toTaskId' in addData && addData.toTaskId) addData.toTaskId = resolveId(addData.toTaskId as string);
          if ('event' in addData && addData.event) addData.event = resolveId(addData.event as string);
          if ('resource' in addData && addData.resource) addData.resource = resolveId(addData.resource as string);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          store.add(addData);
        }
      }

      // 3. Updates
      if (changes.updated) {
        for (const item of changes.updated) {
          const id = item.id as string;
          if (!id) continue;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const record = store.getById(id);
          if (!record) continue;

          const updateFields: Record<string, unknown> = { ...item };
          delete updateFields.id;

          // Get new version from result if available
          const resultRow = resultRows?.rows?.find(r => r.id === id);
          if (resultRow?.version != null) {
            updateFields.version = resultRow.version;
          }

          // Resolve parent ID for tasks
          if ('parentId' in updateFields && updateFields.parentId) {
            updateFields.parentId = resolveId(updateFields.parentId as string);
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          record.set(updateFields);
        }
      }
    }
  } finally {
    // Resume engine and let it recalculate
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    project.resumeAutoSync?.();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void project.commitAsync();
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Subscribe to Ably real-time channel for a Gantt project.
 * Receives sync events from other users and applies them to Bryntum stores.
 * Also manages presence (who's viewing the chart).
 *
 * Returns isApplyingRemoteRef which callers should check in store change
 * listeners to suppress auto-save for remote-applied changes.
 */
export function useGanttRealtime({
  projectId,
  userId,
  userName,
  userAvatar,
  getGanttInstance,
  enabled,
}: UseGanttRealtimeOptions) {
  const isApplyingRemoteRef = useRef(false);
  const channelName = projectId ? `project:${projectId}:gantt` : 'disabled';
  const shouldSubscribe = enabled && !!projectId;

  // Handle incoming sync messages
  const handleSyncMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const data = message.data as SyncMessageData;

      // Skip own events — we already have optimistic updates
      if (data.userId === userId) return;

      const gantt = getGanttInstance();
      if (!gantt?.project) return;

      isApplyingRemoteRef.current = true;

      try {
        applyRemoteChanges(gantt, data);
      } catch (err) {
        console.error('[Ably] Failed to apply remote changes:', err);
      } finally {
        // Clear flag after microtask queue drains (same pattern as isSyncingRef)
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 0);
      }
    },
    [userId, getGanttInstance],
  );

  // Subscribe to Ably channel for sync events
  // We call the hook unconditionally (React rules) but use `skip` to disable
  useChannel(
    { channelName, skip: !shouldSubscribe },
    'sync',
    handleSyncMessage as (message: Ably.Message) => void,
  );

  // Presence — enter presence so others can see us
  usePresence(
    { channelName, skip: !shouldSubscribe },
    {
      name: userName,
      avatar: userAvatar,
      joinedAt: Date.now(),
    },
  );

  // Presence listener — get list of who's viewing the chart
  const { presenceData } = usePresenceListener(
    { channelName, skip: !shouldSubscribe },
  );

  return {
    isApplyingRemoteRef,
    presenceData: (presenceData ?? []) as Array<{ clientId: string; data?: { name?: string; avatar?: string; joinedAt?: number } }>,
  };
}
