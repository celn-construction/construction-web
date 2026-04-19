interface ReconcileTaskStore {
  getById?: (id: string) => { data?: Record<string, unknown> } | null;
}

interface SyncPack {
  tasks?: {
    added?: Array<Record<string, unknown>>;
    removed?: Array<{ id: string | number }>;
  };
}

// Bryntum's scheduling engine commits dirty state during deferred calculations,
// which can drop records from the CrudManager's added/removed bags before sync
// fires. Callers populate pendingAdded/Removed from `taskStore.on('add'/'remove')`
// which fire reliably at user-action time — this injects any records Bryntum lost
// so the outgoing pack matches what the user did.
export function reconcileSyncPack(
  pack: unknown,
  taskStore: ReconcileTaskStore | undefined,
  pendingAddedIds: Set<string>,
  pendingRemovedIds: Set<string>
): void {
  if (!pack || typeof pack !== 'object') return;
  const typed = pack as SyncPack;

  if (pendingAddedIds.size > 0 && taskStore?.getById) {
    const bagAddedIds = new Set((typed.tasks?.added ?? []).map((t) => String(t.id)));
    const missing = Array.from(pendingAddedIds).filter((id) => !bagAddedIds.has(id));
    if (missing.length > 0) {
      typed.tasks = typed.tasks ?? {};
      typed.tasks.added = typed.tasks.added ?? [];
      for (const id of missing) {
        const record = taskStore.getById(id);
        if (record?.data) {
          typed.tasks.added.push({ ...record.data });
        }
      }
    }
  }

  if (pendingRemovedIds.size > 0) {
    const bagRemovedIds = new Set((typed.tasks?.removed ?? []).map((t) => String(t.id)));
    const missing = Array.from(pendingRemovedIds).filter((id) => !bagRemovedIds.has(id));
    if (missing.length > 0) {
      typed.tasks = typed.tasks ?? {};
      typed.tasks.removed = typed.tasks.removed ?? [];
      for (const id of missing) {
        typed.tasks.removed.push({ id });
      }
    }
  }
}
