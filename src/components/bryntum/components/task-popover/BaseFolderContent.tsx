'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { FileText, CloudArrowUp } from '@phosphor-icons/react';
import type { FolderContentProps, PreviewDoc } from './types';

function BaseFolderContentInner({
  docs,
  onSelectDoc,
  selectedDocId,
  onUpload,
  folderName,
}: FolderContentProps) {
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
                ? 'var(--mui-palette-primary-main)'
                : 'var(--mui-palette-text-secondary)'}
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
