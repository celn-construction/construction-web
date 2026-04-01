'use client';

import { create } from 'zustand';
import { useEffect } from 'react';

interface TaskEntry {
  id: string;
  name: string;
}

interface InternalState {
  added: Map<string, string>;    // id → name
  modified: Map<string, string>; // id → name
  removed: Map<string, string>;  // id → name
}

interface GanttChangesStore {
  hasChanges: boolean;
  changeCount: number;
  added: string[];
  modified: string[];
  removed: string[];
  activeVersionName: string | null;
  setActiveVersionName: (name: string | null) => void;
  handleTaskChange: (type: 'add' | 'remove' | 'update', tasks: TaskEntry[]) => void;
  reset: () => void;
}

function computePublicState(internal: InternalState) {
  const added = Array.from(internal.added.values());
  const modified = Array.from(internal.modified.values());
  const removed = Array.from(internal.removed.values());
  const changeCount = added.length + modified.length + removed.length;
  return { hasChanges: changeCount > 0, changeCount, added, modified, removed };
}

export const useGanttChangesStore = create<GanttChangesStore>((set) => {
  let internal: InternalState = {
    added: new Map(),
    modified: new Map(),
    removed: new Map(),
  };

  return {
    hasChanges: false,
    changeCount: 0,
    added: [],
    modified: [],
    removed: [],
    activeVersionName: null,

    setActiveVersionName: (name) => set({ activeVersionName: name }),

    handleTaskChange: (type, tasks) => {
      const added = new Map(internal.added);
      const modified = new Map(internal.modified);
      const removed = new Map(internal.removed);

      for (const task of tasks) {
        if (type === 'add') {
          if (removed.has(task.id)) {
            removed.delete(task.id);
          } else {
            added.set(task.id, task.name);
          }
          modified.delete(task.id);
        } else if (type === 'remove') {
          if (added.has(task.id)) {
            added.delete(task.id);
          } else {
            removed.set(task.id, task.name);
          }
          modified.delete(task.id);
        } else if (type === 'update') {
          if (!added.has(task.id)) {
            modified.set(task.id, task.name);
          }
        }
      }

      internal = { added, modified, removed };
      set(computePublicState(internal));
    },

    reset: () => {
      internal = { added: new Map(), modified: new Map(), removed: new Map() };
      set(computePublicState(internal));
    },
  };
});

/**
 * Hook that subscribes to window custom events and feeds them into the Zustand store.
 * Call this once in a component that mounts early (e.g., the app layout).
 */
export function useGanttChangesListener() {
  const { handleTaskChange, reset, setActiveVersionName } = useGanttChangesStore();

  useEffect(() => {
    const onTaskChange = (e: Event) => {
      const { type, tasks } = (e as CustomEvent<{
        type: 'add' | 'remove' | 'update';
        tasks: TaskEntry[];
      }>).detail;
      handleTaskChange(type, tasks);
    };

    const onVersionSaved = (e: Event) => {
      const name = (e as CustomEvent<{ name?: string }>).detail?.name;
      if (name) setActiveVersionName(name);
      reset();
    };

    const onVersionRestored = (e: Event) => {
      const name = (e as CustomEvent<{ name?: string }>).detail?.name;
      if (name) setActiveVersionName(name);
      reset();
    };

    const onReload = () => reset();

    window.addEventListener('gantt-task-change', onTaskChange);
    window.addEventListener('gantt-version-saved', onVersionSaved);
    window.addEventListener('gantt-version-restored', onVersionRestored);
    window.addEventListener('gantt-reload', onReload);
    return () => {
      window.removeEventListener('gantt-task-change', onTaskChange);
      window.removeEventListener('gantt-version-saved', onVersionSaved);
      window.removeEventListener('gantt-version-restored', onVersionRestored);
      window.removeEventListener('gantt-reload', onReload);
    };
  }, [handleTaskChange, reset, setActiveVersionName]);
}
