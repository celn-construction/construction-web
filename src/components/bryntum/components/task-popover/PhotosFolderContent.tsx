'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { SquaresFour, List, FileText, CloudArrowUp } from '@phosphor-icons/react';
import type { FolderContentProps, PreviewDoc } from './types';

function PhotosFolderContentInner({
  docs,
  onSelectDoc,
  selectedDocId,
  onUpload,
}: FolderContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (docs.length === 0) {
    return (
      <Box
        onClick={onUpload}
        sx={{
          ml: '36px',
          mr: 0.75,
          my: 0.75,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          border: '1.5px dashed',
          borderColor: 'divider',
          borderRadius: '10px',
          bgcolor: 'rgba(0,0,0,0.015)',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(43, 45, 66, 0.05)',
            '& .dropzone-icon': {
              transform: 'translateY(-2px)',
              bgcolor: 'rgba(43, 45, 66, 0.12)',
            },
          },
        }}
      >
        <Box
          className="dropzone-icon"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,0.06)',
            transition: 'transform 0.2s, background-color 0.2s',
          }}
        >
          <CloudArrowUp size={20} weight="bold" color="var(--mui-palette-text-secondary)" />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary', lineHeight: 1.2 }}>
            Drop files or click to upload
          </Typography>
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
          {docs.map((doc) => (
            <Box
              key={doc.id}
              onClick={() => onSelectDoc(makePreview(doc))}
              sx={{
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
                },
              }}
            >
              {doc.mimeType.startsWith('image/') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={doc.blobUrl}
                  alt={doc.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="var(--mui-palette-text-disabled)" />
                </Box>
              )}
            </Box>
          ))}
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
              <FileText size={14} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
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
