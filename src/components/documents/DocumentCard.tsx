'use client';

import { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  Folder,
  Calendar,
  SquareCheck,
  CircleDashed,
  Download,
  Share2,
  Trash2,
  Ellipsis,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatFileSize } from '@/lib/utils/formatting';
import { getCategoryLabel } from '@/lib/constants/documentCategories';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import type { DocumentResult } from './types';

interface DocumentCardProps {
  doc: DocumentResult;
  organizationId: string;
}

export default function DocumentCard({ doc, organizationId }: DocumentCardProps) {
  const theme = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isImage = doc.mimeType.startsWith('image/');
  const categoryLabel = getCategoryLabel(doc.folderId);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteOpen(true);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
      }}
    >
      {/* Image container */}
      <Box
        sx={{
          height: 160,
          bgcolor: 'background.default',
          borderRadius: '14px 14px 0 0',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isImage ? (
          <Box
            component="img"
            src={doc.blobUrl}
            alt={doc.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('excel') || doc.mimeType === 'text/csv'
              ? <FileSpreadsheet size={48} style={{ color: theme.palette.text.secondary }} />
              : <FileText size={48} style={{ color: theme.palette.text.secondary }} />}
          </Box>
        )}
      </Box>

      {/* Card body */}
      <Box
        sx={{
          px: '16px',
          pt: '16px',
          pb: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Title */}
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {doc.name}
        </Typography>

        {/* Category row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Folder size={11} style={{ color: theme.palette.primary.main }} />
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '999px',
              bgcolor: 'docExplorer.badgeBg',
              px: '8px',
              py: '2px',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2, color: 'info.main' }}>
              {categoryLabel}
            </Typography>
          </Box>
        </Box>

        {/* Meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={11} style={{ color: theme.palette.text.secondary }} />
            <Typography sx={{ fontSize: 11, lineHeight: 1.2, color: 'text.secondary' }}>
              {format(new Date(doc.createdAt), 'MMM d, yyyy')}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, lineHeight: 1.2, color: 'text.secondary' }}>
            {formatFileSize(doc.size)}
          </Typography>
        </Box>

        {/* Task link row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', pt: '6px' }}>
          {doc.taskId ? (
            <>
              <SquareCheck size={12} style={{ color: theme.palette.docExplorer.linkedGreen }} />
              <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2, color: 'docExplorer.linkedGreen' }}>
                Linked to task
              </Typography>
            </>
          ) : (
            <>
              <CircleDashed size={12} style={{ color: theme.palette.text.secondary }} />
              <Typography
                sx={{ fontSize: 11, fontStyle: 'italic', lineHeight: 1.2, color: 'text.secondary' }}
              >
                No task linked
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Divider */}
      <Box sx={{ height: '1px', bgcolor: 'divider' }} />

      {/* Action row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          py: '8px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box
            component="a"
            href={doc.blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'flex', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Download size={14} />
          </Box>
          <Box
            component="button"
            sx={{
              display: 'flex',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              p: 0,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Share2 size={14} />
          </Box>
          <Box
            component="button"
            onClick={handleDeleteClick}
            sx={{
              display: 'flex',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              p: 0,
              color: 'text.secondary',
              transition: 'color 0.15s',
              '&:hover': { color: 'docExplorer.destructiveMain' },
            }}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </Box>
        </Box>

        <Box
          component="button"
          sx={{
            display: 'flex',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
        >
          <Ellipsis size={14} />
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
