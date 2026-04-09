'use client';

import { useState } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import {
  DownloadSimple,
  Trash,
  FileText,
  FileXls,
  FileImage,
  CheckSquare,
  CircleDashed,
  Folder,
  Calendar,
  HardDrive,
  User,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { formatFileSize } from '@/lib/utils/formatting';
import { getCategoryLabel } from '@/lib/constants/documentCategories';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import type { DocumentResult } from './types';

interface DocumentCardDetailProps {
  doc: DocumentResult;
  organizationId: string;
}

function getDetailFileIcon(mimeType: string, color: string) {
  if (mimeType.startsWith('image/')) return <FileImage size={22} color={color} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
    return <FileXls size={22} color={color} />;
  return <FileText size={22} color={color} />;
}

/**
 * Option D: "Stacked Metadata" — Detail-Rich
 * No preview. Pure metadata card with label:value pairs stacked vertically.
 * Everything visible, no hidden info. Explicit action buttons.
 */
export default function DocumentCardDetail({ doc, organizationId }: DocumentCardDetailProps) {
  const theme = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isImage = doc.mimeType.startsWith('image/');
  const categoryLabel = getCategoryLabel(doc.folderId);

  const metaRows = [
    { icon: <Folder size={12} color={theme.palette.text.disabled} />, label: 'Category', value: categoryLabel },
    { icon: <Calendar size={12} color={theme.palette.text.disabled} />, label: 'Uploaded', value: format(new Date(doc.createdAt), 'MMM d, yyyy') },
    { icon: <HardDrive size={12} color={theme.palette.text.disabled} />, label: 'Size', value: formatFileSize(doc.size) },
    { icon: <User size={12} color={theme.palette.text.disabled} />, label: 'By', value: doc.uploadedBy.name ?? doc.uploadedBy.email },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
      }}
    >
      {/* Header — thumbnail + filename */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: '16px',
          pt: '16px',
          pb: '12px',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '8px',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
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
            getDetailFileIcon(doc.mimeType, theme.palette.text.secondary)
          )}
        </Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
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
      </Box>

      {/* Divider */}
      <Box sx={{ height: '1px', bgcolor: 'divider', mx: '16px' }} />

      {/* Metadata rows */}
      <Box sx={{ px: '16px', py: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {metaRows.map((row) => (
          <Box key={row.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.icon}
            <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'text.disabled', width: 60, flexShrink: 0 }}>
              {row.label}
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'text.primary' }}>
              {row.value}
            </Typography>
          </Box>
        ))}

        {/* Task row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {doc.taskId ? (
            <CheckSquare size={12} color={theme.palette.docExplorer.linkedGreen} />
          ) : (
            <CircleDashed size={12} color={theme.palette.text.disabled} />
          )}
          <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'text.disabled', width: 60, flexShrink: 0 }}>
            Task
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1,
              color: doc.taskId ? 'docExplorer.linkedGreen' : 'text.disabled',
            }}
          >
            {doc.taskId ? 'Linked' : 'Not linked'}
          </Typography>
        </Box>
      </Box>

      {/* Divider */}
      <Box sx={{ height: '1px', bgcolor: 'divider' }} />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: '16px', py: '10px' }}>
        <Box
          component="a"
          href={doc.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            px: '10px',
            py: '5px',
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'transparent',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.12s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <DownloadSimple size={12} color={theme.palette.text.secondary} />
          <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'text.secondary' }}>
            Download
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteOpen(true); }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            px: '10px',
            py: '5px',
            borderRadius: '6px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.12s, color 0.12s',
            '&:hover': { bgcolor: 'docExplorer.destructiveLight', borderColor: 'docExplorer.destructiveMain' },
          }}
        >
          <Trash size={12} color={theme.palette.text.secondary} />
          <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'text.secondary' }}>
            Delete
          </Typography>
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
