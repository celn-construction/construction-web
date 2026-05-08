'use client';

import { useEffect, useRef } from 'react';
import { useSnackbar } from '@/hooks/useSnackbar';

interface GanttStore {
  on: (event: string, handler: () => void) => void;
  un: (event: string, handler: () => void) => void;
  count?: number;
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

const STORAGE_PREFIX = 'gantt-draft-v5-';
const SAVE_DEBOUNCE_MS = 250;

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

// With autoSync:true the database is the source of truth, but a refresh
// during an in-flight sync request could lose the most recent edit.
// Persisting Bryntum's project state to localStorage covers that gap.
interface DraftBundle {
  projectJson: string;
  savedAt: number;
}

function parseBundle(saved: string): DraftBundle | null {
  try {
    const parsed = JSON.parse(saved) as Partial<DraftBundle>;
    if (typeof parsed.projectJson !== 'string') return null;
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

export function useGanttDraft({ getGanttInstance, projectId, isLoading }: UseGanttDraftOptions) {
  const restoredRef = useRef(false);
  const { showSnackbar } = useSnackbar();
  // Surface the quota warning at most once per session — if it fires once and
  // the user keeps editing, repeating the warning every ~250ms would drown them.
  const quotaWarnedRef = useRef(false);

  // Restore draft once after Bryntum finishes loading server data.
  useEffect(() => {
    if (isLoading || !projectId || restoredRef.current) return;
    const project = getGanttInstance()?.project;
    if (!project) return;

    restoredRef.current = true;

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

    // Defer past the wrapper's post-load commitAsync → enableStm chain.
    // Applying mid-flight caused records to be silently dropped. 500ms is
    // a heuristic — an explicit completion signal would be more robust.
    const timer = setTimeout(() => {
      try {
        (project as { json: string }).json = bundle.projectJson;

        void project.commitAsync?.().catch((err: unknown) => {
          console.warn('[useGanttDraft] restore: commitAsync error', err);
        });
      } catch (err) {
        console.warn('[useGanttDraft] restore failed', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading, projectId, getGanttInstance]);

  // Save the project state on store change, debounced. With autoSync flushing
  // every ~500ms the draft only needs to cover the in-flight gap, so saving
  // on every event would be wasted work (a 200-task project.json round-trips
  // ~50–200KB through JSON.stringify per write).
  useEffect(() => {
    if (isLoading || !projectId) return;
    const project = getGanttInstance()?.project;
    if (!project) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
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
          savedAt: Date.now(),
        };
        localStorage.setItem(storageKey(projectId), JSON.stringify(bundle));
      } catch (err) {
        // QuotaExceededError: localStorage is full. Without a warning the user
        // keeps editing and assumes drafts are protecting them when they aren't.
        const isQuota = err instanceof DOMException &&
          (err.name === 'QuotaExceededError' || err.code === 22);
        if (isQuota && !quotaWarnedRef.current) {
          quotaWarnedRef.current = true;
          showSnackbar(
            'Browser storage is full — your edits sync to the server but cannot be recovered locally if the page reloads mid-save.',
            'warning',
          );
        }
        console.warn('[useGanttDraft] save: error writing', err);
      }
    };

    const scheduleSave = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, SAVE_DEBOUNCE_MS);
    };

    project.taskStore?.on('change', scheduleSave);
    project.dependencyStore?.on('change', scheduleSave);

    return () => {
      project.taskStore?.un('change', scheduleSave);
      project.dependencyStore?.un('change', scheduleSave);
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, projectId, getGanttInstance]);

  // Clear draft after a successful sync — autoSync flushes within seconds,
  // so the draft only persists long enough to cover the in-flight gap.
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
