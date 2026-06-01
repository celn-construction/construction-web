'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import { ImageSquare, UploadSimple, ArrowsClockwise, Trash } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { trackUpload } from '@/store/uploadStatusStore';

interface CoverImageBannerProps {
  taskId?: string;
  projectId: string;
  organizationId: string;
  coverImageUrl: string | null;
  canManage: boolean;
}

const HERO_HEIGHT = 160;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB — matches /api/upload/task-cover

export default function CoverImageBanner({
  taskId,
  projectId,
  organizationId,
  coverImageUrl,
  canManage,
}: CoverImageBannerProps) {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  // Cache-bust token bumped on each successful upload. taskCoverProxyUrl is
  // version-less, so without this the replaced cover keeps the same <img src>
  // and the browser never refetches the new blob.
  const [coverVersion, setCoverVersion] = useState(0);

  // Reset the load shimmer whenever the cover source changes.
  useEffect(() => {
    setHeroLoaded(false);
  }, [coverImageUrl]);

  const refreshCover = useCallback(() => {
    if (!taskId) return;
    void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
  }, [organizationId, projectId, taskId, utils]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!taskId || busy) return;
      setBusy(true);
      const result = await trackUpload<{ imageUrl: string }>(
        file,
        () => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);
          formData.append('taskId', taskId);
          return fetch('/api/upload/task-cover', { method: 'POST', body: formData });
        },
        { doneLabel: 'Cover image ready', maxBytes: MAX_BYTES },
      );
      setBusy(false);
      if (result.ok) {
        setCoverVersion((v) => v + 1);
        refreshCover();
      } else if (result.error) showSnackbar(result.error, 'error');
    },
    [taskId, projectId, busy, refreshCover, showSnackbar],
  );

  const handleRemove = useCallback(async () => {
    if (!taskId || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/upload/task-cover', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to remove cover');
      }
      refreshCover();
      showSnackbar('Cover image removed', 'success');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed to remove cover', 'error');
    } finally {
      setBusy(false);
    }
  }, [taskId, projectId, busy, refreshCover, showSnackbar]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      const file = accepted[0];
      if (file) void uploadFile(file);
    },
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: !canManage || busy,
  });

  // ── Empty state ──
  if (!coverImageUrl) {
    // Viewers without manage permission just see a quiet placeholder.
    if (!canManage) {
      return (
        <Box
          sx={{
            mx: '14px',
            mb: '4px',
            height: HERO_HEIGHT,
            borderRadius: '10px',
            border: '1.5px dashed',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            color: 'text.disabled',
          }}
        >
          <ImageSquare size={18} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1.2 }}>
            No cover image
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        {...getRootProps()}
        onClick={busy ? undefined : open}
        sx={{
          mx: '14px',
          mb: '4px',
          height: HERO_HEIGHT,
          borderRadius: '10px',
          border: '1.5px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          textAlign: 'center',
          px: 3,
          cursor: 'pointer',
          color: 'text.disabled',
          transition: 'border-color 0.2s, background-color 0.2s, color 0.2s',
          '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
        }}
      >
        <input {...getInputProps()} />
        <UploadSimple size={20} weight="bold" />
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
          {isDragActive ? 'Drop image to set cover' : 'Upload cover image'}
        </Typography>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 400, color: 'text.disabled', lineHeight: 1.4, maxWidth: 260 }}>
          Drag & drop or click to add a cover for this task. PNG, JPG, WebP, or GIF up to 10MB.
        </Typography>
      </Box>
    );
  }

  // ── Filled state ──
  const heroSrc = coverVersion > 0 ? `${coverImageUrl}?v=${coverVersion}` : coverImageUrl;

  return (
    <Box sx={{ mx: '14px', mb: '4px' }}>
      <Box
        {...(canManage ? getRootProps() : {})}
        sx={{
          position: 'relative',
          height: HERO_HEIGHT,
          borderRadius: '10px',
          overflow: 'hidden',
          bgcolor: 'background.default',
          outline: isDragActive ? '2px solid' : 'none',
          outlineColor: 'primary.main',
          '&:hover .cover-actions': { opacity: 1 },
        }}
      >
        {canManage && <input {...getInputProps()} />}

        {!heroLoaded && (
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
              background:
                'linear-gradient(90deg, var(--bg-primary) 25%, var(--border-color) 50%, var(--bg-primary) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s ease-in-out infinite',
            }}
          >
            <ImageSquare size={18} color="var(--text-secondary)" />
          </Box>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt="Task cover"
          onLoad={() => setHeroLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Drag-to-replace hint */}
        {isDragActive && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <UploadSimple size={16} weight="bold" />
            Drop to replace cover
          </Box>
        )}

        {/* Hover actions: replace + remove (managers only) */}
        {canManage && (
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
            <CoverActionButton
              icon={<ArrowsClockwise size={12} weight="bold" />}
              label="Replace"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            />
            <CoverActionButton
              icon={<Trash size={12} weight="bold" />}
              label="Remove"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                void handleRemove();
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function CoverActionButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
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
        '&:disabled': { opacity: 0.6, cursor: 'wait' },
        transition: 'background-color 0.15s',
      }}
    >
      {icon}
      {label}
    </Box>
  );
}
