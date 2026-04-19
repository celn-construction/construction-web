interface VersionedTaskStore {
  getById?: (id: string) => { get?: (field: string) => unknown } | null;
}

// Bryntum only writes user-edited fields in the sync pack. `version` is never
// edited by users, so the server's optimistic-lock check would fail without
// manual injection here.
export function injectTaskVersions(pack: unknown, taskStore: VersionedTaskStore | undefined): void {
  const taskChanges = (pack as { tasks?: { updated?: Array<Record<string, unknown>> } } | null | undefined)?.tasks;
  if (!taskChanges?.updated || !taskStore?.getById) return;
  for (const task of taskChanges.updated) {
    if (typeof task.id !== 'string') continue;
    const record = taskStore.getById(task.id);
    const version = record?.get?.('version');
    if (typeof version === 'number') {
      task.version = version;
    }
  }
}
