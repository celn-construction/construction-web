'use client';

import { useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Camera } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/ui/UserAvatar';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';

interface AvatarUploaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  size?: number;
  borderRadius?: number | string;
}

export default function AvatarUploader({
  user,
  size = 64,
  borderRadius = 14,
}: AvatarUploaderProps) {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const busy = isUploading || isRemoving;
  const hasCustomImage = !!user.image;

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({ error: 'Upload failed' }))) as {
          error?: string;
        };
        throw new Error(error || 'Upload failed');
      }

      await utils.user.me.invalidate();
      showSnackbar('Profile photo updated', 'success');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch('/api/upload/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove photo');
      await utils.user.me.invalidate();
      showSnackbar('Profile photo removed', 'success');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed to remove photo', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          cursor: busy ? 'default' : 'pointer',
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          '&:hover .avatar-overlay': {
            opacity: busy ? 0 : 1,
          },
        }}
        onClick={busy ? undefined : handlePick}
        role="button"
        aria-label="Change profile photo"
      >
        <UserAvatar user={user} size={size} borderRadius={`${borderRadius}px`} />

        {!busy && (
          <Box
            className="avatar-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.15s ease',
              color: 'common.white',
            }}
          >
            <Camera size={20} weight="regular" />
          </Box>
        )}

        {busy && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={Math.round(size * 0.4)} sx={{ color: 'white' }} />
          </Box>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={handleFile}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
          {user.name ?? 'User'}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.3 }}>
          {user.email}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handlePick}
            disabled={busy}
            loading={isUploading}
          >
            Change photo
          </Button>
          {hasCustomImage && (
            <Button
              size="small"
              variant="text"
              onClick={handleRemove}
              disabled={busy}
              loading={isRemoving}
            >
              Remove
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
