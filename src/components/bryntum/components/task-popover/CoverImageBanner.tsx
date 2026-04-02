'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import { Image, Trash, ImageSquare } from '@phosphor-icons/react';
import UploadOverlay from '@/components/ui/UploadOverlay';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';

interface CoverImageBannerProps {
  taskId?: string;
  projectId: string;
  organizationId: string;
  coverImageUrl: string | null;
}

export default function CoverImageBanner({
  taskId,
  projectId,
  organizationId,
  coverImageUrl,
}: CoverImageBannerProps) {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDeleting, setCoverDeleting] = useState(false);
  const [coverImageLoaded, setCoverImageLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setCoverImageLoaded(false);
  }, [coverImageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadCoverImage = useCallback(
    async (file: File) => {
      if (!taskId) return;
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setCoverUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('taskId', taskId);
        const res = await fetch('/api/gantt/cover-image', { method: 'POST', body: formData });
        if (res.ok) {
          void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
        } else {
          const body = await res.json().catch(() => ({ error: 'Upload failed' }));
          showSnackbar((body as { error?: string }).error ?? 'Upload failed', 'error');
        }
      } finally {
        setCoverUploading(false);
        URL.revokeObjectURL(preview);
        setPreviewUrl(null);
      }
    },
    [taskId, projectId, organizationId, utils, showSnackbar]
  );

  const handleCoverRemove = useCallback(async () => {
    if (!taskId) return;
    setCoverUploading(true);
    setCoverDeleting(true);
    try {
      const res = await fetch('/api/gantt/cover-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId }),
      });
      if (res.ok) {
        void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
      }
    } finally {
      setCoverUploading(false);
      setCoverDeleting(false);
    }
  }, [taskId, projectId, organizationId, utils]);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop: (files) => {
      if (files[0]) void uploadCoverImage(files[0]);
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      if (code === 'file-too-large') {
        showSnackbar('Image must be under 10MB', 'error');
      } else if (code === 'file-invalid-type') {
        showSnackbar('Only JPG, PNG, GIF, and WebP images are supported', 'error');
      } else {
        showSnackbar('File not accepted', 'error');
      }
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    noClick: !!coverImageUrl,
    noKeyboard: !!coverImageUrl,
    disabled: coverUploading,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        mx: '14px',
        mb: '4px',
        height: 200,
        overflow: 'hidden',
        outline: 'none',
        position: 'relative',
        borderRadius: '10px',
        bgcolor: isDragActive
          ? 'action.selected'
          : coverImageUrl
            ? 'transparent'
            : 'background.default',
        border: coverImageUrl ? 'none' : '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.2s',
        '&:hover .cover-actions': { opacity: 1 },
        '&:hover .empty-cover': { borderColor: 'text.secondary', color: 'text.secondary' },
        cursor: coverImageUrl ? 'default' : 'pointer',
      }}
    >
      <input {...getInputProps()} />

      {coverUploading ? (
        <UploadOverlay
          previewUrl={previewUrl}
          variant={coverDeleting ? 'dark' : previewUrl ? 'dark' : 'light'}
          text={coverDeleting ? 'Removing…' : 'Uploading…'}
        />
      ) : coverImageUrl ? (
        <>
          {!coverImageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' },
                },
                background: 'linear-gradient(90deg, var(--mui-palette-background-default) 25%, var(--mui-palette-divider) 50%, var(--mui-palette-background-default) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            >
              <ImageSquare size={18} color="var(--mui-palette-text-disabled)" />
            </Box>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt="Task cover"
            onLoad={() => setCoverImageLoaded(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              background: 'linear-gradient(to top, var(--mui-palette-background-paper), transparent)',
              pointerEvents: 'none',
            }}
          />
          <Box
            className="cover-actions"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          >
            <Box
              component="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                openFilePicker();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'white',
                height: 26,
                px: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.625rem',
                fontWeight: 500,
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
                lineHeight: 1,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                transition: 'background-color 0.15s',
              }}
              aria-label="Change cover image"
            >
              <Image size={12} />
              Change
            </Box>
            <Box
              component="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                void handleCoverRemove();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'white',
                height: 26,
                px: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.625rem',
                fontWeight: 500,
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
                lineHeight: 1,
                '&:hover': { bgcolor: 'rgba(185,28,28,0.7)' },
                transition: 'background-color 0.15s',
              }}
              aria-label="Remove cover image"
            >
              <Trash size={12} />
              Remove
            </Box>
          </Box>
        </>
      ) : (
        <Box
          className="empty-cover"
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            borderRadius: 'inherit',
            border: '1.5px dashed',
            borderColor: isDragActive ? 'text.secondary' : 'divider',
            color: isDragActive ? 'text.secondary' : 'text.disabled',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          <Image size={15} />
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: 'inherit', lineHeight: 1 }}>
            {isDragActive ? 'Drop image here' : 'Add cover image'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
