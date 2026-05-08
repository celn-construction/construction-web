'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { SquaresFour, List, FileText, PushPin, Plus } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import type { FolderContentProps, PreviewDoc } from './types';

function PhotosFolderContentInner({
  docs,
  onSelectDoc,
  selectedDocId,
  onUpload,
  projectId,
  taskId,
  organizationId,
  pinnedDocId,
}: FolderContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const canPin = !!projectId && !!taskId && !!organizationId;
  const pinMutation = api.gantt.pinPhoto.useMutation({
    onSuccess: () => {
      if (canPin) {
        void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
      }
    },
    onError: (err) => showSnackbar(err.message || 'Failed to pin photo', 'error'),
  });

  const handlePin = (docId: string, currentlyPinned: boolean) => {
    if (!canPin) return;
    pinMutation.mutate({
      projectId,
      taskId,
      documentId: currentlyPinned ? null : docId,
    });
  };

  const AddPhotoTile = (
    <Box
      component="button"
      onClick={onUpload}
      aria-label="Add photo"
      sx={{
        height: 70,
        borderRadius: '8px',
        border: '1.5px dashed',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'text.disabled',
        transition: 'border-color 0.2s, background-color 0.2s, color 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.selected',
          color: 'primary.main',
        },
      }}
    >
      <Plus size={16} weight="bold" />
    </Box>
  );

  if (docs.length === 0) {
    return (
      <Box sx={{ pt: 1, pl: '20px' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
          }}
        >
          {AddPhotoTile}
        </Box>
      </Box>
    );
  }

  const makePreview = (doc: (typeof docs)[0]): PreviewDoc => ({
    id: doc.id,
    name: doc.name,
    blobUrl: doc.blobUrl,
    mimeType: doc.mimeType,
    size: doc.size,
    createdAt: doc.createdAt,
    uploadedBy: doc.uploadedBy ?? null,
    folderId: doc.folderId,
    approvalStatus: doc.approvalStatus,
    approvedAt: doc.approvedAt,
    approvedBy: doc.approvedBy,
  });

  return (
    <Box sx={{ pt: 1, pl: '20px' }}>
      {/* View toggle + date */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            bgcolor: 'action.selected',
            borderRadius: '12px',
            p: '2px',
          }}
        >
          {(['grid', 'list'] as const).map((mode) => (
            <Box
              key={mode}
              component="button"
              onClick={() => setViewMode(mode)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                py: 0.5,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                bgcolor: viewMode === mode ? 'background.paper' : 'transparent',
                color: viewMode === mode ? 'text.primary' : 'text.secondary',
                transition: 'all 0.15s',
                boxShadow: viewMode === mode ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}
              aria-label={`${mode} view`}
            >
              {mode === 'grid' ? <SquaresFour size={13} /> : <List size={13} />}
            </Box>
          ))}
        </Box>
        {docs[0]?.createdAt != null && (
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary' }}>
            {new Date(docs[0].createdAt).toLocaleDateString(
              'en-US',
              { month: 'short', year: 'numeric' }
            )}
          </Typography>
        )}
      </Box>

      {viewMode === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', pt: 0.5 }}>
          {docs.map((doc) => {
            const isPinned = pinnedDocId === doc.id;
            const isImage = doc.mimeType.startsWith('image/');
            return (
              <Box
                key={doc.id}
                onClick={() => onSelectDoc(makePreview(doc))}
                sx={{
                  position: 'relative',
                  height: 70,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  bgcolor: 'action.hover',
                  border: '2px solid',
                  borderColor: selectedDocId === doc.id ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.15s, transform 0.15s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    borderColor: selectedDocId === doc.id ? 'primary.main' : 'divider',
                    '& .pin-toggle': { opacity: 1 },
                  },
                }}
              >
                {isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={doc.blobUrl}
                    alt={doc.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="var(--text-secondary)" />
                  </Box>
                )}

                {/* Pin toggle — only for images, only when pin context is available */}
                {canPin && isImage && (
                  <Box
                    className="pin-toggle"
                    component="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handlePin(doc.id, isPinned);
                    }}
                    disabled={pinMutation.isPending}
                    aria-label={isPinned ? 'Unpin cover' : 'Pin as cover'}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      bgcolor: isPinned ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(6px)',
                      color: 'white',
                      opacity: isPinned ? 1 : 0,
                      transition: 'opacity 0.15s, background-color 0.15s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                      '&:disabled': { opacity: 0.6, cursor: 'wait' },
                    }}
                  >
                    <PushPin size={11} weight={isPinned ? 'fill' : 'regular'} />
                  </Box>
                )}
              </Box>
            );
          })}
          {AddPhotoTile}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.125, pt: 0.5 }}>
          {docs.map((doc) => (
            <Box
              key={doc.id}
              onClick={() => onSelectDoc(makePreview(doc))}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: '5px',
                pr: 1,
                pl: '18px',
                borderRadius: '12px',
                cursor: 'pointer',
                bgcolor: selectedDocId === doc.id ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <FileText size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <Typography
                sx={{
                  fontSize: 12,
                  flex: 1,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {doc.name}
              </Typography>
              {pinnedDocId === doc.id && (
                <PushPin
                  size={11}
                  weight="fill"
                  color="var(--text-secondary)"
                  style={{ flexShrink: 0 }}
                />
              )}
              {doc.createdAt != null && (
                <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0, opacity: 0.7 }}>
                  {new Date(doc.createdAt).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric' }
                  )}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

const PhotosFolderContent = React.memo(PhotosFolderContentInner);
export default PhotosFolderContent;
