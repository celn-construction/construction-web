'use client';

import { useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Camera } from '@phosphor-icons/react';
import OrgAvatar from '@/components/ui/OrgAvatar';

interface OrgLogoUploaderProps {
  name: string;
  seed: string;
  logoUrl?: string | null;
  size?: number;
  borderRadius?: number | string;
  disabled?: boolean;
  onUpload: (url: string) => void | Promise<void>;
  onError: (message: string) => void;
}

export default function OrgLogoUploader({
  name,
  seed,
  logoUrl,
  size = 72,
  borderRadius = '14px',
  disabled = false,
  onUpload,
  onError,
}: OrgLogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const busy = uploading || disabled;

  const handlePick = () => {
    if (!busy) inputRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/organization/logo', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as { logoUrl?: string; error?: string };

      if (!res.ok || !data.logoUrl) {
        throw new Error(data.error ?? 'Upload failed');
      }

      await onUpload(data.logoUrl);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      onClick={handlePick}
      role="button"
      aria-label="Change organization logo"
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        cursor: busy ? 'default' : 'pointer',
        borderRadius,
        overflow: 'hidden',
        '&:hover .logo-overlay': {
          opacity: busy ? 0 : 1,
        },
      }}
    >
      <OrgAvatar name={name} seed={seed} logoUrl={logoUrl} size={size} borderRadius={borderRadius} />

      {!busy && (
        <Box
          className="logo-overlay"
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

      {uploading && (
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
  );
}
