'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Box, Typography } from '@mui/material';

export interface FileDropzoneProps {
  projectId: string;
  taskId: string;
  folderId: string;
  onUploadComplete: () => void;
  className?: string;
  disabled?: boolean;
}

export function FileDropzone({
  projectId,
  taskId,
  folderId,
  onUploadComplete,
  className,
  disabled = false,
}: FileDropzoneProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('taskId', taskId);
        formData.append('folderId', folderId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        toast.success('File uploaded successfully');
        onUploadComplete();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, taskId, folderId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/dxf': ['.dxf'],
      'application/dwg': ['.dwg'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: disabled || isLoading,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        p: 3,
        border: 2,
        borderStyle: 'dashed',
        borderRadius: 2,
        borderColor: isDragActive ? 'text.secondary' : 'divider',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        opacity: disabled || isLoading ? 0.5 : 1,
        '&:hover': {
          borderColor: disabled || isLoading ? 'divider' : 'text.disabled',
        },
      }}
      className={className}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <Loader2 size={32} style={{ color: 'var(--text-secondary)' }} className="animate-spin" />
      ) : (
        <FileUp size={32} style={{ color: 'var(--text-disabled)' }} />
      )}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {isLoading
            ? 'Uploading...'
            : isDragActive
            ? 'Drop file here'
            : 'Drag & drop or click to upload'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5 }}>
          PDF, images, spreadsheets, Word docs, CAD files up to 50MB
        </Typography>
      </Box>
    </Box>
  );
}
