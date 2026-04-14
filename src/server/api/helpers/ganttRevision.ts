import "server-only";
import { Prisma } from "../../../../generated/prisma";
import type { PrismaClient } from "../../../../generated/prisma";

/**
 * Shape of the changes delta stored in ScheduleRevision.changes.
 * Mirrors the Bryntum CrudManager sync payload structure.
 */
export interface RevisionChanges {
  tasks?: StoreChanges;
  dependencies?: StoreChanges;
  resources?: StoreChanges;
  assignments?: StoreChanges;
  timeRanges?: StoreChanges;
}

interface StoreChanges {
  added?: Array<Record<string, unknown>>;
  updated?: Array<Record<string, unknown>>;
  removed?: Array<{ id: string }>;
}

import type { RevisionSummary } from "@/lib/types/schedule";
export type { RevisionSummary } from "@/lib/types/schedule";

function countChanges(store?: StoreChanges): { added: number; modified: number; removed: number } {
  return {
    added: store?.added?.length ?? 0,
    modified: store?.updated?.length ?? 0,
    removed: store?.removed?.length ?? 0,
  };
}

/** Build a display-friendly summary from the changes delta. */
export function buildRevisionSummary(changes: RevisionChanges): RevisionSummary {
  const tasks = countChanges(changes.tasks);
  const deps = countChanges(changes.dependencies);
  const res = countChanges(changes.resources);
  const assignments = countChanges(changes.assignments);
  const timeRanges = countChanges(changes.timeRanges);

  const totalChanges =
    tasks.added + tasks.modified + tasks.removed +
    deps.added + deps.modified + deps.removed +
    res.added + res.modified + res.removed +
    assignments.added + assignments.modified + assignments.removed +
    timeRanges.added + timeRanges.modified + timeRanges.removed;

  return {
    tasksAdded: tasks.added,
    tasksModified: tasks.modified,
    tasksRemoved: tasks.removed,
    dependenciesAdded: deps.added,
    dependenciesModified: deps.modified,
    dependenciesRemoved: deps.removed,
    resourcesAdded: res.added,
    resourcesModified: res.modified,
    resourcesRemoved: res.removed,
    assignmentsAdded: assignments.added,
    assignmentsModified: assignments.modified,
    assignmentsRemoved: assignments.removed,
    timeRangesAdded: timeRanges.added,
    timeRangesModified: timeRanges.modified,
    timeRangesRemoved: timeRanges.removed,
    totalChanges,
  };
}

/** Check if a sync payload has any real changes worth recording. */
export function hasChanges(changes: RevisionChanges): boolean {
  const { totalChanges } = buildRevisionSummary(changes);
  return totalChanges > 0;
}

/**
 * Record a revision after a successful sync.
 * Stores the raw delta from the sync payload + a summary for display.
 */
export async function recordRevision(
  db: PrismaClient,
  projectId: string,
  createdById: string,
  syncPayload: RevisionChanges,
): Promise<string | null> {
  if (!hasChanges(syncPayload)) return null;

  // Strip phantom IDs and internal fields from the delta to keep it clean.
  // We keep only the server-assigned IDs and the actual field values.
  const changes = sanitizeChanges(syncPayload);
  const summary = buildRevisionSummary(changes);

  const revision = await db.scheduleRevision.create({
    data: {
      projectId,
      createdById,
      changes: changes as unknown as Prisma.InputJsonValue,
      summary: summary as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return revision.id;
}

/**
 * Strip Bryntum-internal fields ($PhantomId, etc.) from changes
 * so the stored delta is clean and doesn't leak internal IDs.
 */
function sanitizeChanges(changes: RevisionChanges): RevisionChanges {
  const sanitizeRecords = (records?: Array<Record<string, unknown>>) => {
    if (!records) return undefined;
    return records.map((r) => {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(r)) {
        if (!key.startsWith('$')) {
          clean[key] = value;
        }
      }
      return clean;
    });
  };

  const sanitizeStore = (store?: StoreChanges): StoreChanges | undefined => {
    if (!store) return undefined;
    return {
      added: sanitizeRecords(store.added),
      updated: sanitizeRecords(store.updated),
      removed: store.removed,
    };
  };

  return {
    tasks: sanitizeStore(changes.tasks),
    dependencies: sanitizeStore(changes.dependencies),
    resources: sanitizeStore(changes.resources),
    assignments: sanitizeStore(changes.assignments),
    timeRanges: sanitizeStore(changes.timeRanges),
  };
}
