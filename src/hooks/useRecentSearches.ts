'use client';

import { useCallback, useEffect, useState } from 'react';

export interface RecentSearch {
  query: string;
  aiMode: boolean;
}

const MAX_RECENTS = 5;

function getStorageKey(userId: string | null | undefined, projectId: string | null | undefined) {
  if (!userId || !projectId) return null;
  return `docs-recent:${userId}:${projectId}`;
}

function readFromStorage(key: string): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentSearch =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as RecentSearch).query === 'string' &&
          typeof (item as RecentSearch).aiMode === 'boolean',
      )
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function useRecentSearches(
  userId: string | null | undefined,
  projectId: string | null | undefined,
) {
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  useEffect(() => {
    const key = getStorageKey(userId, projectId);
    if (!key) {
      setRecents([]);
      return;
    }
    setRecents(readFromStorage(key));
  }, [userId, projectId]);

  const addRecent = useCallback(
    (query: string, aiMode: boolean) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const key = getStorageKey(userId, projectId);
      if (!key) return;
      const trimmedLower = trimmed.toLowerCase();
      setRecents((prev) => {
        const top = prev[0];
        if (top && top.query.toLowerCase() === trimmedLower && top.aiMode === aiMode) {
          return prev;
        }
        const filtered = prev.filter(
          (r) => !(r.query.toLowerCase() === trimmedLower && r.aiMode === aiMode),
        );
        const next = [{ query: trimmed, aiMode }, ...filtered].slice(0, MAX_RECENTS);
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [userId, projectId],
  );

  const clearRecents = useCallback(() => {
    const key = getStorageKey(userId, projectId);
    if (key) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
    setRecents([]);
  }, [userId, projectId]);

  return { recents, addRecent, clearRecents };
}
