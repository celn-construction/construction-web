'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadSimple, X, ChatCircle } from '@phosphor-icons/react';
import { Box, Dialog, Typography, Divider } from '@mui/material';
import { Button } from '@/components/ui/button';
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import UploadOverlay from '@/components/ui/UploadOverlay';
import FileDropzone from '@/components/ui/FileDropzone';
import { useSnackbar } from '@/hooks/useSnackbar';
import { formatFileSize } from '@/lib/utils/formatting';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string;
  folderId: string;
  folderName: string;
  onUploadComplete: () => void;
}

export default function UploadDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  folderId,
  folderName,
  onUploadComplete,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  }, [title]);

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
    maxSize: 50 * 1024 * 1024,
    disabled: isUploading,
  });

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setTitle('');
    setNotes('');
    onOpenChange(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('taskId', taskId);
      formData.append('folderId', folderId);
      if (title.trim()) formData.append('title', title.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      showSnackbar('File uploaded successfully', 'success');
      setFile(null);
      setTitle('');
      setNotes('');
      onUploadComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 720,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 48px -8px rgba(0,0,0,0.19), 0 4px 12px -4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadSimple size={18} color="var(--mui-palette-text-primary)" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
              Upload Document
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 400, color: 'text.secondary' }}>
              Add a file to your project
            </Typography>
          </Box>
        </Box>
        <Box
          onClick={handleClose}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'background.default' },
          }}
        >
          <X size={14} color="var(--mui-palette-text-secondary)" />
        </Box>
      </Box>

      <Divider />

      {/* Body — Two panels */}
      <Box sx={{ display: 'flex', minHeight: 340, position: 'relative' }}>
        {/* Upload overlay */}
        {isUploading && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            <UploadOverlay variant="light" text="Uploading document\u2026" size={28} />
          </Box>
        )}

        {/* Left: Drop Zone Panel */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            bgcolor: 'background.default',
            p: 3,
            borderRight: '1px solid',
            borderRightColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FileDropzone
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            disabled={isUploading}
            hintText="PDF, JPG, PNG, DWG up to 50 MB"
          />
        </Box>

        {/* Right: Form Panel */}
        <Box sx={{ flex: 1, p: '20px 24px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* File Attached Card */}
          {file && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 1.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  bgcolor: (theme: Theme) => alpha(theme.palette.success.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UploadSimple size={16} color="var(--mui-palette-success-main)" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
              <Box
                onClick={handleRemoveFile}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { bgcolor: 'background.default' },
                }}
              >
                <X size={14} color="var(--mui-palette-text-secondary)" />
              </Box>
            </Box>
          )}

          {/* Document Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
              Document Title
            </Typography>
            <Box
              component="input"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter a title for this document"
              sx={{
                width: '100%',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                p: '10px 14px',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: 'text.primary',
                outline: 'none',
                '&::placeholder': { color: 'text.secondary' },
                '&:focus': { borderColor: 'text.secondary' },
              }}
            />
          </Box>

          {/* Notes */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <ChatCircle size={13} color="var(--mui-palette-text-primary)" />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                  Notes
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                Optional
              </Typography>
            </Box>
            <Box
              component="textarea"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add notes about this document..."
              sx={{
                width: '100%',
                flex: 1,
                minHeight: 80,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                p: '12px 14px',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.6,
                color: 'text.primary',
                outline: 'none',
                resize: 'none',
                '&::placeholder': { color: 'text.secondary' },
                '&:focus': { borderColor: 'text.secondary' },
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Footer */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: 3, py: 1.75 }}>
        <Box
          onClick={handleClose}
          sx={{
            borderRadius: 999,
            border: '1px solid',
            borderColor: 'divider',
            px: 2.5,
            py: 1.25,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'background.default' },
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>Cancel</Typography>
        </Box>
        <Button
          onClick={handleUpload}
          loading={isUploading}
          loadingPosition="start"
          disabled={!file}
          startIcon={<UploadSimple size={15} />}
          sx={{
            borderRadius: 999,
            bgcolor: file && !isUploading ? 'text.primary' : 'background.default',
            color: file && !isUploading ? 'background.paper' : 'text.secondary',
            px: 3,
            py: 1.25,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.3,
            opacity: file && !isUploading ? 1 : 0.5,
            boxShadow: file && !isUploading ? '0 1px 4px rgba(0,0,0,0.13)' : 'none',
            transition: 'all 0.2s',
            '&:hover': file && !isUploading ? { opacity: 0.88, bgcolor: 'text.primary' } : {},
            '&.Mui-disabled': {
              bgcolor: file ? 'text.primary' : 'background.default',
              color: file ? 'background.paper' : 'text.secondary',
              opacity: isUploading ? 0.8 : 0.5,
            },
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </Box>
    </Dialog>
  );
}
