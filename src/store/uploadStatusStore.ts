'use client';

import { create } from 'zustand';

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadEntry {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  errorMessage?: string;
  /** Optional override for the "done" line. Defaults to `Uploaded · <size>`. */
  doneLabel?: string;
  /** Set when status === 'error' to allow re-running the same upload from the chip. */
  retry?: () => void;
}

interface UploadStatusStore {
  uploads: UploadEntry[];
  add: (entry: UploadEntry) => void;
  update: (id: string, patch: Partial<Omit<UploadEntry, 'id'>>) => void;
  dismiss: (id: string) => void;
  dismissDone: () => void;
}

export const useUploadStatusStore = create<UploadStatusStore>((set) => ({
  uploads: [],
  add: (entry) =>
    set((s) => ({
      uploads: s.uploads.some((u) => u.id === entry.id)
        ? s.uploads.map((u) => (u.id === entry.id ? { ...u, ...entry } : u))
        : [...s.uploads, entry],
    })),
  update: (id, patch) =>
    set((s) => ({
      uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  dismiss: (id) =>
    set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) })),
  dismissDone: () =>
    set((s) => ({ uploads: s.uploads.filter((u) => u.status !== 'done') })),
}));

interface TrackUploadOptions {
  /** Override the success line. Default: `Uploaded · <size>`. */
  doneLabel?: string;
  /** Max bytes; if file exceeds, the chip shows an error and `fetcher` is never called. */
  maxBytes?: number;
}

interface TrackUploadResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Wrap a fetch in chip lifecycle (pending → uploading → done|error).
 * The fetcher receives an AbortSignal-free `Promise<Response>`-returning callback.
 * Returns the parsed JSON body on success, or `{ ok: false, error }` on failure.
 *
 * Caller is responsible for passing whatever URL/FormData/method shape they need —
 * this helper only owns the chip state and JSON parsing.
 */
export async function trackUpload<T = unknown>(
  file: File,
  fetcher: () => Promise<Response>,
  options: TrackUploadOptions = {},
): Promise<TrackUploadResult<T>> {
  const { add, update } = useUploadStatusStore.getState();
  const id = crypto.randomUUID();

  add({
    id,
    name: file.name,
    size: file.size,
    status: 'pending',
    doneLabel: options.doneLabel,
  });

  // Recursive runner so the retry closure points at the same logic.
  const runOnce = async (): Promise<TrackUploadResult<T>> => {
    if (options.maxBytes && file.size > options.maxBytes) {
      const mb = Math.round(options.maxBytes / (1024 * 1024));
      // Size errors are non-retryable — no `retry` field set.
      update(id, { status: 'error', errorMessage: `File exceeds ${mb} MB`, retry: undefined });
      return { ok: false, error: `File exceeds ${mb} MB` };
    }

    update(id, { status: 'uploading', errorMessage: undefined, retry: undefined });

    try {
      const res = await fetcher();
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = body?.error ?? `Upload failed (${res.status})`;
        update(id, {
          status: 'error',
          errorMessage: message,
          retry: () => { void runOnce(); },
        });
        return { ok: false, error: message };
      }
      const data = (await res.json().catch(() => ({}))) as T;
      update(id, { status: 'done', retry: undefined });
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      update(id, {
        status: 'error',
        errorMessage: message,
        retry: () => { void runOnce(); },
      });
      return { ok: false, error: message };
    }
  };

  return runOnce();
}
