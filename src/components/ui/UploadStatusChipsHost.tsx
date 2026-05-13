'use client';

import { useEffect, useRef } from 'react';
import UploadStatusChips from '@/components/ui/UploadStatusChips';
import { useUploadStatusStore } from '@/store/uploadStatusStore';

const DONE_DISMISS_MS = 4000;

export default function UploadStatusChipsHost() {
  const uploads = useUploadStatusStore((s) => s.uploads);
  const dismiss = useUploadStatusStore((s) => s.dismiss);

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    const seenIds = new Set(uploads.map((u) => u.id));

    uploads.forEach((u) => {
      if (u.status === 'done' && !timers.has(u.id)) {
        const t = setTimeout(() => {
          timers.delete(u.id);
          dismiss(u.id);
        }, DONE_DISMISS_MS);
        timers.set(u.id, t);
      }
    });

    timers.forEach((t, id) => {
      if (!seenIds.has(id)) {
        clearTimeout(t);
        timers.delete(id);
      }
    });
  }, [uploads, dismiss]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return <UploadStatusChips uploads={uploads} onDismiss={dismiss} />;
}
