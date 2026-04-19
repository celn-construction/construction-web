'use client';

import { useEffect, useRef } from 'react';
import { useGanttChangesStore, type GanttChangesSnapshot } from '@/store/ganttChangesStore';

interface GanttStoreRecord {
  id?: string | number;
  name?: string;
  isRoot?: boolean;
  [key: string]: unknown;
}

interface GanttStore {
  on: (event: string, handler: () => void) => void;
  un: (event: string, handler: () => void) => void;
  count?: number;
  records?: GanttStoreRecord[];
}

interface GanttProject {
  json?: string;
  taskStore?: GanttStore;
  dependencyStore?: GanttStore;
  commitAsync?: () => Promise<unknown>;
  on?: (event: string, handler: () => void) => void;
  un?: (event: string, handler: () => void) => void;
}

interface GanttInstance {
  project?: GanttProject;
}

interface UseGanttDraftOptions {
  getGanttInstance: () => GanttInstance | null;
  projectId?: string;
  isLoading: boolean;
}

const STORAGE_PREFIX = 'gantt-draft-v4-';

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

// Bundled format: the Bryntum project state (for Gantt to restore the store)
// plus the live counter snapshot (for the "N changes since last snapshot" badge
// to come back exactly as the user left it).
interface DraftBundle {
  projectJson: string;
  counter: GanttChangesSnapshot;
  savedAt: number;
}

function parseBundle(saved: string): DraftBundle | null {
  try {
    const parsed = JSON.parse(saved) as Partial<DraftBundle>;
    if (typeof parsed.projectJson !== 'string' || !parsed.counter) return null;
    return parsed as DraftBundle;
  } catch {
    return null;
  }
}

function bundleHasTasks(bundle: DraftBundle): boolean {
  try {
    const project = JSON.parse(bundle.projectJson) as { tasks?: unknown[] };
    return Array.isArray(project.tasks) && project.tasks.length > 0;
  } catch {
    return false;
  }
}

// Synchronous check for a saved draft with actual task data. Safe to call
// during initial render — no effects, no Bryntum dependencies. Used by the
// wrapper to auto-unlock edit mode when the user has unsaved work waiting
// to be restored.
export function hasGanttDraft(projectId: string | undefined): boolean {
  if (typeof window === 'undefined' || !projectId) return false;
  try {
    const saved = window.localStorage.getItem(storageKey(projectId));
    if (!saved) return false;
    const bundle = parseBundle(saved);
    return bundle != null && bundleHasTasks(bundle);
  } catch {
    return false;
  }
}

// Per-device draft persistence for Gantt edits. Uses Bryntum's built-in
// `project.json` getter/setter to snapshot and restore the full project
// state — tasks, dependencies, assignments, resources. Drafts survive page
// refresh / navigation; cleared on explicit sync.
export function useGanttDraft({ getGanttInstance, projectId, isLoading }: UseGanttDraftOptions) {
  const restoredRef = useRef(false);

  // Restore draft once after Bryntum finishes loading server data.
  useEffect(() => {
    if (isLoading || !projectId || restoredRef.current) return;
    const project = getGanttInstance()?.project;
    if (!project) return;

    restoredRef.current = true;

    // The "N changes since last snapshot" counter is a singleton Zustand store.
    // On project switch (component remount with a new projectId), it still
    // holds counts from the previous project. Reset before we decide what to
    // repopulate it with.
    useGanttChangesStore.getState().reset();

    const saved = localStorage.getItem(storageKey(projectId));
    if (!saved) return;

    const bundle = parseBundle(saved);
    if (!bundle || !bundleHasTasks(bundle)) {
      try {
        localStorage.removeItem(storageKey(projectId));
      } catch {
        // ignore
      }
      return;
    }

    // Defer restore past the wrapper's post-load effects (commitAsync +
    // enableStm). At isLoading:false, the wrapper schedules a commitAsync; its
    // .then(() => enableStm()) runs async. If we restore mid-flight, something
    // in that chain clears our records. 500ms is a heuristic that's worked
    // reliably — if we regress, an explicit completion signal from the wrapper
    // would be better.
    const timer = setTimeout(() => {
      try {
        (project as { json: string }).json = bundle.projectJson;

        // Hydrate the counter from the persisted snapshot — the exact state
        // the user saw before refresh, including adds/modifies/removes that
        // we couldn't infer from the store alone.
        useGanttChangesStore.getState().hydrate(bundle.counter);

        // Trigger a commitAsync so the chart paints the restored records.
        void project.commitAsync?.().catch((err: unknown) => {
          console.warn('[useGanttDraft] restore: commitAsync error', err);
        });
      } catch (err) {
        console.warn('[useGanttDraft] restore failed', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading, projectId, getGanttInstance]);

  // Save the full project state on every store change. No debounce — the
  // `taskCount === 0` guard below filters Bryntum's transient empty states,
  // and debouncing would risk losing the user's last action if they refresh
  // immediately after editing (e.g., delete task then Cmd+R).
  useEffect(() => {
    if (isLoading || !projectId) return;
    const project = getGanttInstance()?.project;
    if (!project) return;

    const save = () => {
      try {
        const projectJson = (project as { json?: string }).json;
        const taskCount = project.taskStore?.count ?? 0;
        // Skip empty project.json (Bryntum returns nothing before init is done)
        // and zero-task states (Bryntum's internal reconciliation fires `change`
        // events mid-operation with the store momentarily empty — persisting
        // that would wipe a valid draft).
        if (!projectJson || taskCount === 0) return;

        const bundle: DraftBundle = {
          projectJson,
          counter: useGanttChangesStore.getState().serialize(),
          savedAt: Date.now(),
        };
        localStorage.setItem(storageKey(projectId), JSON.stringify(bundle));
      } catch (err) {
        console.warn('[useGanttDraft] save: error writing', err);
      }
    };

    project.taskStore?.on('change', save);
    project.dependencyStore?.on('change', save);

    return () => {
      project.taskStore?.un('change', save);
      project.dependencyStore?.un('change', save);
    };
  }, [isLoading, projectId, getGanttInstance]);

  // Clear draft when the user explicitly syncs (Create Snapshot succeeds).
  useEffect(() => {
    if (!projectId) return;
    const project = getGanttInstance()?.project;
    if (!project?.on || !project.un) return;

    const clear = () => {
      try {
        localStorage.removeItem(storageKey(projectId));
      } catch {
        // ignore
      }
    };

    project.on('sync', clear);
    return () => {
      project.un?.('sync', clear);
    };
  }, [projectId, getGanttInstance]);
}
