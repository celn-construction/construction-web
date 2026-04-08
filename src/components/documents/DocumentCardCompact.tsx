'use client';

import { useState } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import {
  DownloadSimple,
  Trash,
  DotsThree,
  FileText,
  FileXls,
  CheckSquare,
  CircleDashed,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { formatFileSize } from '@/lib/utils/formatting';
import { getCategoryLabel } from '@/lib/constants/documentCategories';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import type { DocumentResult } from './types';

interface DocumentCardCompactProps {
  doc: DocumentResult;
  organizationId: string;
}

/**
 * Option C: "Two-Line Compact" — Balanced
 * Small square thumbnail (48×48) on the left. Row 1: filename + category badge.
 * Row 2: date · size · uploader · task status. Actions on hover.
 */
export default function DocumentCardCompact({ doc, organizationId }: DocumentCardCompactProps) {
  const theme = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isImage = doc.mimeType.startsWith('image/');
  const categoryLabel = getCategoryLabel(doc.folderId);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: '14px',
        py: '10px',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: hovered ? alpha(theme.palette.primary.main, 0.3) : 'divider',
        bgcolor: 'background.paper',
        transition: 'border-color 0.2s, background-color 0.15s',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '8px',
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isImage ? (
          <Box
            component="img"
            src={doc.blobUrl}
            alt={doc.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('excel') || doc.mimeType === 'text/csv'
            ? <FileXls size={20} color={theme.palette.text.disabled} />
            : <FileText size={20} color={theme.palette.text.disabled} />
        )}
      </Box>

      {/* Text content */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Row 1: name + badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {doc.name}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '4px',
              bgcolor: 'docExplorer.badgeBg',
              px: '6px',
              py: '2px',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 600, lineHeight: 1, color: 'text.secondary' }}>
              {categoryLabel}
            </Typography>
          </Box>
        </Box>

        {/* Row 2: meta */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.secondary' }}>
            {format(new Date(doc.createdAt), 'MMM d, yyyy')}
          </Typography>
          <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.disabled' }}>·</Typography>
          <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.secondary' }}>
            {formatFileSize(doc.size)}
          </Typography>
          {doc.uploadedBy.name && (
            <>
              <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.disabled' }}>·</Typography>
              <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.secondary' }}>
                {doc.uploadedBy.name}
              </Typography>
            </>
          )}
          <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.disabled' }}>·</Typography>
          {doc.taskId ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckSquare size={10} color={theme.palette.docExplorer.linkedGreen} />
              <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'docExplorer.linkedGreen' }}>
                Linked
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CircleDashed size={10} color={theme.palette.text.disabled} />
              <Typography sx={{ fontSize: 11, lineHeight: 1, color: 'text.disabled' }}>
                Unlinked
              </Typography>
            </Box>
          )}
        </Box>

        {/* Row 3: description / notes */}
        {doc.description && (
          <Typography
            sx={{
              fontSize: 11,
              lineHeight: 1.4,
              color: 'text.disabled',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doc.description}
          </Typography>
        )}
      </Box>

      {/* Hover actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
      >
        <Box
          component="a"
          href={doc.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '6px',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
          }}
        >
          <DownloadSimple size={14} />
        </Box>
        <Box
          component="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteOpen(true); }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '6px',
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover', color: 'docExplorer.destructiveMain' },
          }}
        >
          <Trash size={14} />
        </Box>
        <Box
          component="button"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '6px',
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
          }}
        >
          <DotsThree size={14} />
        </Box>
      </Box>

      <DeleteDocumentDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        documentId={doc.id}
        documentName={doc.name}
        organizationId={organizationId}
      />
    </Box>
  );
}
