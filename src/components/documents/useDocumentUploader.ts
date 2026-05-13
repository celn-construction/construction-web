'use client';

import { useCallback } from 'react';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { trackUpload } from '@/store/uploadStatusStore';

interface UseDocumentUploaderArgs {
  organizationId: string;
  projectId: string;
}

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Project-scoped uploader: posts each file to /api/upload without taskId/folderId.
 * Documents land in the "unassigned" state. The doc-explorer surfaces them via
 * the Unassigned filter chip and a "Click to assign" pill on each card.
 *
 * Progress chips are rendered by the global `<UploadStatusChipsHost />` mounted
 * in AppShell — callers only invoke `upload(files)` and don't manage chip state.
 */
export function useDocumentUploader({ organizationId, projectId }: UseDocumentUploaderArgs) {
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Sequential upload — keeps memory + bandwidth predictable, matches existing UploadDialog behavior.
      for (const file of files) {
        const result = await trackUpload<{ documentId?: string }>(
          file,
          () => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId);
            // taskId + folderId omitted intentionally → unassigned
            return fetch('/api/upload', { method: 'POST', body: formData });
          },
          {
            maxBytes: MAX_BYTES,
            doneLabel: `Uploaded · Unassigned`,
          },
        );

        if (!result.ok && result.error) {
          showSnackbar(`${file.name}: ${result.error}`, 'error');
        }
      }

      // Invalidate search results so newly-uploaded docs appear, plus the unassigned counter.
      void utils.document.search.invalidate({ organizationId, projectId });
      void utils.document.aiSearch.invalidate({ organizationId, projectId });
      void utils.document.countUnassigned.invalidate({ organizationId, projectId });
    },
    [organizationId, projectId, utils, showSnackbar],
  );

  return { upload };
}
