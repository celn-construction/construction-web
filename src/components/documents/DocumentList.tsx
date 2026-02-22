'use client';

import { Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/trpc/react';
import { getFileIcon } from '@/lib/utils/files';
import { formatFileSize } from '@/lib/utils/formatting';
import { Box, Typography, Stack, Skeleton, IconButton } from '@mui/material';

interface DocumentListProps {
  organizationId: string;
  projectId: string;
  taskId: string;
  folderId: string;
}


export function DocumentList({
  organizationId,
  projectId,
  taskId,
  folderId,
}: DocumentListProps) {
  const utils = api.useUtils();
  const { data: documents, isLoading } = api.document.listByFolder.useQuery({
    organizationId,
    projectId,
    taskId,
    folderId,
  });

  const deleteMutation = api.document.delete.useMutation({
    onSuccess: () => {
      void utils.document.listByFolder.invalidate();
      void utils.document.countByTask.invalidate();
    },
  });

  const handleDelete = (e: React.MouseEvent, documentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate({ documentId, organizationId });
    }
  };

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
              '& .delete-button': {
                opacity: 1,
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
          <IconButton
            className="delete-button"
            size="small"
            onClick={(e) => handleDelete(e, doc.id)}
            disabled={deleteMutation.isPending}
            sx={{
              flexShrink: 0,
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.contrastText',
              },
            }}
          >
            <Trash2 size={16} />
          </IconButton>
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
