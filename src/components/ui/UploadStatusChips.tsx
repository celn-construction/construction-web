'use client';

import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowClockwise, Check, Warning, X } from '@phosphor-icons/react';
import { formatFileSize } from '@/lib/utils/formatting';
import type { UploadEntry } from '@/store/uploadStatusStore';

interface UploadStatusChipsProps {
  uploads: UploadEntry[];
  onDismiss: (id: string) => void;
}

export default function UploadStatusChips({ uploads, onDismiss }: UploadStatusChipsProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (uploads.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1400,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: 360,
        pointerEvents: 'auto',
      }}
    >
      <AnimatePresence initial={false}>
        {uploads.map((file) => {
          const isError = file.status === 'error';
          const isDone = file.status === 'done';
          const isActive = file.status === 'uploading' || file.status === 'pending';

          return (
            <Box
              key={file.id}
              component={motion.div}
              layout
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                px: '12px',
                py: '10px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: isError ? 'docExplorer.destructiveMain' : 'divider',
                bgcolor: 'background.paper',
                boxShadow: isDark
                  ? '0 6px 18px rgba(0,0,0,0.4)'
                  : '0 6px 18px rgba(43,45,66,0.10)',
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: isError ? 'docExplorer.destructiveLight' : 'action.hover',
                  color: isError
                    ? 'docExplorer.destructiveMain'
                    : isDone
                      ? 'docExplorer.linkedGreen'
                      : 'primary.main',
                }}
              >
                {isActive && <CircularProgress size={14} thickness={5} color="inherit" />}
                {isDone && <Check size={14} weight="bold" />}
                {isError && <Warning size={14} weight="bold" />}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: isError ? 'docExplorer.destructiveMain' : 'text.secondary',
                    lineHeight: 1.4,
                    mt: '1px',
                  }}
                >
                  {isError
                    ? (file.errorMessage ?? 'Upload failed')
                    : isDone
                      ? (file.doneLabel ?? `Uploaded · ${formatFileSize(file.size)}`)
                      : file.status === 'uploading'
                        ? `Uploading · ${formatFileSize(file.size)}`
                        : `Queued · ${formatFileSize(file.size)}`}
                </Typography>
              </Box>

              {isError && file.retry && (
                <Box
                  component="button"
                  onClick={() => file.retry?.()}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: 22,
                    px: '8px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'docExplorer.destructiveMain',
                    bgcolor: 'transparent',
                    color: 'docExplorer.destructiveMain',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1,
                    flexShrink: 0,
                    transition: 'background-color 0.12s, color 0.12s',
                    '&:hover': {
                      bgcolor: 'docExplorer.destructiveMain',
                      color: 'background.paper',
                    },
                  }}
                  aria-label="Retry upload"
                >
                  <ArrowClockwise size={11} weight="bold" />
                  Retry
                </Box>
              )}

              <Box
                component="button"
                onClick={() => onDismiss(file.id)}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '6px',
                  border: 'none',
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                }}
                aria-label="Dismiss"
              >
                <X size={12} weight="bold" />
              </Box>
            </Box>
          );
        })}
      </AnimatePresence>
    </Box>
  );
}
