'use client';

import { useState } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Download, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatting';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import type { DocumentResult } from './types';

interface DocumentCardGalleryProps {
  doc: DocumentResult;
  organizationId: string;
}

export default function DocumentCardGallery({ doc, organizationId }: DocumentCardGalleryProps) {
  const theme = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isImage = doc.mimeType.startsWith('image/');
  const isUnassigned = !doc.taskId;

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: 'relative',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: isUnassigned
          ? alpha(theme.palette.warning.main, 0.5)
          : hovered
            ? alpha(theme.palette.primary.main, 0.3)
            : 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'pointer',
        willChange: 'transform',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 20px rgba(0,0,0,0.4)'
            : '0 8px 20px rgba(43,45,66,0.10)',
        },
      }}
    >
      {/* Preview area */}
      <Box
        sx={{
          width: '100%',
          aspectRatio: '1',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('excel') || doc.mimeType === 'text/csv'
            ? <FileSpreadsheet size={32} style={{ color: theme.palette.text.disabled }} />
            : <FileText size={32} style={{ color: theme.palette.text.disabled }} />
        )}
      </Box>

      {/* Persistent unassigned indicator (top-left) */}
      {isUnassigned && (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            px: '6px',
            py: '2px',
            borderRadius: '4px',
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(4px)',
            color: theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark,
            border: `1px dashed ${alpha(theme.palette.warning.main, 0.5)}`,
            zIndex: 1,
          }}
        >
          <Typography sx={{ fontSize: 9, fontWeight: 700, lineHeight: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Unassigned
          </Typography>
        </Box>
      )}

      {/* Hover overlay with actions */}
      {hovered && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.5) 100%)',
            borderRadius: '9px',
          }}
        >
          {/* Top actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', p: '8px' }}>
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
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                backdropFilter: 'blur(4px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <Download size={14} />
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
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                backdropFilter: 'blur(4px)',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.6)' },
              }}
            >
              <Trash2 size={14} />
            </Box>
          </Box>

          {/* Bottom info */}
          <Box sx={{ p: '8px' }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.3,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {doc.name}
            </Typography>
            <Typography sx={{ fontSize: 10, lineHeight: 1.3, color: 'rgba(255,255,255,0.7)', mt: '2px' }}>
              {formatFileSize(doc.size)}
            </Typography>
          </Box>
        </Box>
      )}

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
