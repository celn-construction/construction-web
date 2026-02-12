'use client';

import { FileText, FileSpreadsheet, FileImage, Download } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/trpc/react';
import { Box, Typography, Stack, Skeleton } from '@mui/material';

interface DocumentListProps {
  organizationId: string;
  projectId: string;
  taskId: string;
  folderId: string;
}

function getFileIcon(mimeType: string) {
  const iconStyle = { color: 'var(--text-secondary)' };
  if (mimeType.startsWith('image/')) {
    return <FileImage size={20} style={iconStyle} />;
  }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return <FileSpreadsheet size={20} style={iconStyle} />;
  }
  return <FileText size={20} style={iconStyle} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  organizationId,
  projectId,
  taskId,
  folderId,
}: DocumentListProps) {
  const { data: documents, isLoading } = api.document.listByFolder.useQuery({
    organizationId,
    projectId,
    taskId,
    folderId,
  });

  if (isLoading) {
    return (
      <Stack spacing={1}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={64} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No documents uploaded yet
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {documents.map((doc) => (
        <Box
          key={doc.id}
          component="a"
          href={doc.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            transition: 'background-color 0.2s',
            textDecoration: 'none',
            '&:hover': {
              bgcolor: 'action.hover',
              '& .download-icon': {
                color: 'text.primary',
              },
            },
          }}
        >
          <Box sx={{ flexShrink: 0 }}>{getFileIcon(doc.mimeType)}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {doc.name}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.75rem',
                color: 'text.secondary',
              }}
            >
              <span>{formatFileSize(doc.size)}</span>
              <span>•</span>
              <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
              {doc.uploadedBy.name && (
                <>
                  <span>•</span>
                  <span>{doc.uploadedBy.name}</span>
                </>
              )}
            </Box>
          </Box>
          <Download
            size={16}
            className="download-icon"
            style={{ color: 'var(--text-disabled)', flexShrink: 0 }}
          />
        </Box>
      ))}
    </Stack>
  );
}
