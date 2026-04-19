'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface UploadOverlayProps {
  /** Optional preview image URL to show dimmed behind the overlay */
  previewUrl?: string | null;
  /** Text below the spinner (default: "Uploading...") */
  text?: string;
  /** Spinner size in px (default: 24) */
  size?: number;
  /** Overlay variant: "dark" for image overlays, "light" for form areas */
  variant?: 'dark' | 'light';
}

export default function UploadOverlay({
  previewUrl,
  text = 'Uploading\u2026',
  size = 24,
  variant = 'dark',
}: UploadOverlayProps) {
  const isDark = variant === 'dark';

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Uploading preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
          }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          zIndex: 1,
        }}
      >
        <CircularProgress size={size} sx={{ color: isDark ? 'common.white' : 'text.secondary' }} />
        {text && (
          <Typography
            sx={{
              fontSize: 12,
              color: isDark ? 'white' : 'text.secondary',
              fontWeight: 500,
            }}
          >
            {text}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
