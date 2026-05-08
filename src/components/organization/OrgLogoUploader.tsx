'use client';

import { useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Camera } from '@phosphor-icons/react';
import OrgAvatar from '@/components/ui/OrgAvatar';
import { trackUpload } from '@/store/uploadStatusStore';

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
    const result = await trackUpload<{ logoUrl?: string }>(
      file,
      () => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch('/api/organization/logo', { method: 'POST', body: formData });
      },
      { doneLabel: 'Logo updated' },
    );
    setUploading(false);

    if (result.ok && result.data?.logoUrl) {
      await onUpload(result.data.logoUrl);
    } else {
      onError(result.error ?? 'Upload failed');
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
