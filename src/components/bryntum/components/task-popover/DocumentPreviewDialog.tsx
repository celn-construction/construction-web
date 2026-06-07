'use client';

import { Dialog, Box, Typography } from '@mui/material';
import {
  ImageSquare,
  FileText,
  ArrowSquareOut,
  DownloadSimple,
  X,
} from '@phosphor-icons/react';
import { formatFileSize } from '@/lib/utils/formatting';
import type { PreviewDoc } from './types';

interface DocumentPreviewDialogProps {
  open: boolean;
  doc: PreviewDoc | null;
  onClose: () => void;
}

export default function DocumentPreviewDialog({
  open,
  doc,
  onClose,
}: DocumentPreviewDialogProps) {
  const isImage = doc?.mimeType.startsWith('image/') ?? false;
  const isPdf = doc?.mimeType === 'application/pdf';

  const dateLabel = doc
    ? new Date(doc.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const typeLabel = doc
    ? (doc.mimeType.split('/')[1]?.toUpperCase() ?? doc.mimeType)
    : '';

  return (
    <Dialog
      open={open && !!doc}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: '88vh',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        },
      }}
    >
      {doc && (
        <>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              px: 2,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              {isImage ? (
                <ImageSquare size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              ) : (
                <FileText size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              )}
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                {doc.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              {[
                {
                  icon: ArrowSquareOut,
                  label: 'Open in new tab',
                  onClick: () => window.open(doc.blobUrl, '_blank', 'noopener,noreferrer'),
                },
                { icon: X, label: 'Close', onClick: onClose },
              ].map(({ icon: Icon, label, onClick }) => (
                <Box
                  key={label}
                  component="button"
                  onClick={onClick}
                  aria-label={label}
                  sx={{
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: 'none',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  <Icon size={15} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Preview area */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {isImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={doc.blobUrl}
                alt={doc.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : isPdf ? (
              <Box
                component="iframe"
                src={doc.blobUrl}
                title={doc.name}
                sx={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.secondary',
                }}
              >
                <FileText size={56} color="var(--text-secondary)" />
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  Preview isn&rsquo;t available for this file type.
                </Typography>
                <Box
                  component="button"
                  onClick={() => window.open(doc.blobUrl, '_blank', 'noopener,noreferrer')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    color: 'text.primary',
                    fontSize: 12,
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <DownloadSimple size={14} weight="bold" />
                  Open in new tab
                </Box>
              </Box>
            )}
          </Box>

          {/* Metadata footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px 12px',
              px: 2,
              py: 1.25,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            {doc.uploadedBy?.name && (
              <MetaItem label="Uploaded by" value={doc.uploadedBy.name} />
            )}
            <MetaItem label="Date" value={dateLabel} />
            <MetaItem label="Size" value={formatFileSize(doc.size)} />
            <MetaItem label="Type" value={typeLabel} />
          </Box>
        </>
      )}
    </Dialog>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
      <Typography
        sx={{
          fontSize: '0.5625rem',
          fontWeight: 600,
          color: 'text.disabled',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  );
}
