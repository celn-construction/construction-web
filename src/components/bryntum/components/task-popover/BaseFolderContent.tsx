'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { FileText } from '@phosphor-icons/react';
import type { FolderContentProps, PreviewDoc } from './types';

function BaseFolderContentInner({
  docs,
  onSelectDoc,
  selectedDocId,
  folderName,
}: FolderContentProps) {
  if (docs.length === 0) {
    return (
      <Box sx={{ pl: '20px', py: 0.75 }}>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.2 }}>
          No {folderName.toLowerCase()} yet — use + to upload
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pl: '20px', display: 'flex', flexDirection: 'column', gap: 0.125 }}>
      {docs.map((doc) => {
        const isSelected = selectedDocId === doc.id;
        const preview: PreviewDoc = {
          id: doc.id,
          name: doc.name,
          blobUrl: doc.blobUrl,
          mimeType: doc.mimeType,
          size: doc.size,
          createdAt: doc.createdAt,
          uploadedBy: doc.uploadedBy ?? null,
        };

        return (
          <Box
            key={doc.id}
            onClick={() => onSelectDoc(preview)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pt: '5px',
              pb: '5px',
              pr: 1,
              pl: '18px',
              borderRadius: '12px',
              cursor: 'pointer',
              bgcolor: isSelected ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
            }}
          >
            <FileText
              size={14}
              color={isSelected
                ? 'var(--accent-primary)'
                : 'var(--text-secondary)'}
              style={{ flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: isSelected ? 500 : 400,
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
              <Typography
                sx={{
                  fontSize: 11,
                  color: 'text.secondary',
                  flexShrink: 0,
                }}
              >
                {new Date(doc.createdAt).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                )}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

const BaseFolderContent = React.memo(BaseFolderContentInner);
export default BaseFolderContent;
