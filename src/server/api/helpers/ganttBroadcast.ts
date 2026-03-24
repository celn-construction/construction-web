import "server-only";
import { getAblyRest } from "@/lib/ably";

interface SyncStoreChanges {
  added?: unknown[];
  updated?: unknown[];
  removed?: Array<{ id: string }>;
}

interface SyncResultRows {
  rows: Array<{ $PhantomId?: string; id: string; version?: number }>;
}

interface SyncInput {
  tasks?: SyncStoreChanges;
  dependencies?: SyncStoreChanges;
  resources?: SyncStoreChanges;
  assignments?: SyncStoreChanges;
  timeRanges?: SyncStoreChanges;
}

interface SyncResult {
  tasks?: SyncResultRows;
  dependencies?: SyncResultRows;
  resources?: SyncResultRows;
  assignments?: SyncResultRows;
  timeRanges?: SyncResultRows;
}

/**
 * Broadcast Gantt sync changes to all connected clients via Ably.
 * Publishes a single batched "sync" event containing the full changeset
 * and phantom ID mappings, ensuring atomic application on receivers.
 *
 * Fire-and-forget — callers should void + .catch() this.
 */
export async function broadcastGanttChanges(
  projectId: string,
  userId: string,
  input: SyncInput,
  result: SyncResult,
): Promise<void> {
  const ably = getAblyRest();
  if (!ably) return;

  const channel = ably.channels.get(`project:${projectId}:gantt`);

  await channel.publish("sync", {
    userId,
    timestamp: Date.now(),
    input,
    result,
  });
}
