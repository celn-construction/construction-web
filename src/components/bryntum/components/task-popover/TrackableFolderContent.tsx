'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { CloudArrowUp, FileText, CheckCircle } from '@phosphor-icons/react';
import type { FolderContentProps, PreviewDoc } from './types';
import { api } from '@/trpc/react';
import type { SlotKind } from '@/lib/validations/gantt';

interface TrackableFolderContentProps extends FolderContentProps {
  required: number | null;
  folderColor: string;
  kind?: SlotKind;
}

function TrackableFolderContentInner({
  docs,
  onSelectDoc,
  selectedDocId,
  onUpload,
  folderName,
  required,
  folderColor,
  kind,
  taskId,
  projectId,
  organizationId,
}: TrackableFolderContentProps) {
  // Slot metadata (names) — shares the React Query cache with SubmittalDrawer.
  const slotsQuery = api.gantt.listSlots.useQuery(
    { organizationId: organizationId!, projectId: projectId!, taskId: taskId!, kind: kind! },
    { enabled: !!kind && !!taskId && !!projectId && !!organizationId && (required ?? 0) > 0 },
  );
  const slotMeta = slotsQuery.data ?? [];
  // No requirement set — empty state (no dropzones until a requirement is configured)
  if (required === null || required === 0) {
    return (
      <Box
        sx={{
          ml: '36px',
          mr: 0.75,
          my: 0.75,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.2 }}>
          No {folderName.toLowerCase()} required
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.2 }}>
          Set a requirement to start tracking
        </Typography>
      </Box>
    );
  }

  // Requirement is set — render N slots
  const singularName = folderName.replace(/s$/i, '');
  const slots = Array.from({ length: required }, (_, i) => {
    const doc = docs[i] ?? null;
    return { index: i, doc };
  });

  return (
    <Box sx={{ pl: '20px', display: 'flex', flexDirection: 'column', gap: '4px', py: 0.75 }}>
      {slots.map(({ index, doc }) => {
        const slotNum = index + 1;
        const isFilled = !!doc;
        const isSelected = isFilled && selectedDocId === doc.id;

        if (isFilled) {
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
                gap: 0.75,
                py: '5px',
                px: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              {/* Slot number badge — filled */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: `${folderColor}18`,
                  flexShrink: 0,
                }}
              >
                <CheckCircle size={11} weight="fill" color={folderColor} />
              </Box>

              <FileText
                size={14}
                color={isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'}
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
                  minWidth: 0,
                }}
              >
                {doc.name}
              </Typography>
              {doc.createdAt != null && (
                <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}>
                  {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              )}
            </Box>
          );
        }

        // Empty slot — mini dropzone
        return (
          <Box
            key={`empty-${index}`}
            onClick={onUpload}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              py: '6px',
              px: 1,
              borderRadius: '8px',
              border: '1.5px dashed',
              borderColor: 'divider',
              bgcolor: 'action.hover',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': {
                borderColor: folderColor,
                bgcolor: `${folderColor}06`,
              },
            }}
          >
            {/* Slot number badge — empty */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontSize: 9, fontWeight: 600, color: 'text.secondary', lineHeight: 1 }}>
                {slotNum}
              </Typography>
            </Box>

            <CloudArrowUp size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: 11,
                color: 'text.secondary',
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {slotMeta[index]?.name?.trim() || `${singularName} ${slotNum}`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

const TrackableFolderContent = React.memo(TrackableFolderContentInner);
export default TrackableFolderContent;
