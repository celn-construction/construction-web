'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadSimple, X, Sparkle } from '@phosphor-icons/react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Button } from '@/components/ui/button';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
      if (f.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(f));
      } else {
        setPreviewUrl(null);
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.heic', '.heif', '.tiff'],
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setNotes('');
    onOpenChange(false);
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleGenerateDescription = async () => {
    if (!file || isGenerating) return;
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/describe', { method: 'POST', body: formData });
      const data = await response.json() as { description?: string; error?: string };
      if (!response.ok) {
        showSnackbar(data.error ?? 'Could not generate description', 'error');
        return;
      }
      if (data.description) {
        setNotes(data.description);
      }
    } catch {
      showSnackbar('Could not generate description', 'error');
    } finally {
      setIsGenerating(false);
    }
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
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

  const inputSx = {
    width: '100%',
    borderRadius: '8px',
    bgcolor: alpha(theme.palette.divider, 0.08),
    border: '1.5px solid transparent',
    p: '10px 14px',
    color: 'text.primary',
    outline: 'none',
    transition: 'all 0.15s ease',
    '&::placeholder': {
      color: alpha(theme.palette.text.secondary, 0.5),
      opacity: 1,
    },
    '&:hover': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '&:focus': {
      borderColor: theme.palette.primary.main,
      bgcolor: 'background.paper',
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 460,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: `0 24px 64px -16px ${alpha('#000', 0.2)}, 0 8px 20px -8px ${alpha('#000', 0.08)}`,
        },
      }}
    >
      {/* Accent bar */}
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.3)})`,
        }}
      />

      {/* Header */}
      <Box sx={{ p: 3.5, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UploadSimple size={22} style={{ color: theme.palette.primary.main }} />
          </Box>
          <Box sx={{ pt: 0.25 }}>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              Upload Document
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: 'text.secondary',
                mt: 0.25,
                lineHeight: 1.4,
              }}
            >
              Add a file to {folderName}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <DialogContent sx={{ px: 3.5, pt: 2.5, pb: 1, position: 'relative' }}>
        {isUploading && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            <UploadOverlay variant="light" text="Uploading document…" size={28} />
          </Box>
        )}

        {/* Dropzone ↔ File card swap */}
        {!file ? (
          <Box sx={{ mb: 2.5 }}>
            <FileDropzone
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              disabled={isUploading}
              hintText="PDF, JPG, PNG, DWG up to 50 MB"
              sx={{ py: 4 }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: 1.5,
              mb: 2.5,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.success.main, 0.06),
              border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt={file.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <UploadSimple size={16} style={{ color: theme.palette.success.main }} />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
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
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
              }}
            >
              <X size={14} style={{ color: theme.palette.text.secondary }} />
            </Box>
          </Box>
        )}

        {/* Document Title */}
        <Box sx={{ mb: 2 }}>
          <Typography
            component="label"
            htmlFor="doc-title-input"
            sx={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 0.75,
            }}
          >
            Document Title
          </Typography>
          <Box
            component="input"
            id="doc-title-input"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Enter a title for this document"
            sx={{ ...inputSx, fontSize: '0.9375rem' }}
          />
        </Box>

        {/* Notes */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography
              component="label"
              htmlFor="doc-notes-input"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Notes
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {file && (
                <Box
                  component="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || isUploading}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.375,
                    borderRadius: '6px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    color: 'primary.main',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isGenerating ? 0.6 : 1,
                    '&:hover:not(:disabled)': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                    },
                    '&:disabled': { cursor: 'default' },
                  }}
                >
                  <Sparkle size={11} weight="fill" />
                  {isGenerating ? 'Generating...' : 'Describe with AI'}
                </Box>
              )}
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', fontWeight: 400 }}>
                Optional
              </Typography>
            </Box>
          </Box>
          <Box
            component="textarea"
            id="doc-notes-input"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Add notes about this document..."
            rows={3}
            sx={{
              ...inputSx,
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              minHeight: 72,
              resize: 'none',
            }}
          />
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3.5, py: 2.5, gap: 1 }}>
        <Button
          variant="text"
          onClick={handleClose}
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.8125rem',
            px: 2,
            borderRadius: '8px',
            '&:hover': {
              bgcolor: alpha(theme.palette.divider, 0.12),
              color: 'text.primary',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          loading={isUploading}
          loadingPosition="start"
          disabled={!file}
          startIcon={<UploadSimple size={16} />}
          sx={{
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.8125rem',
            px: 2.5,
            py: 1,
            textTransform: 'none',
            boxShadow: `0 1px 3px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
            },
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
