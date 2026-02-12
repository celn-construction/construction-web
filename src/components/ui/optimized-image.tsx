'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box, Skeleton, Typography, type SxProps, type Theme } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  sx?: SxProps<Theme>;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  quality?: number;
}

const ImageSkeleton = ({ sx }: { sx?: SxProps<Theme> }) => (
  <Skeleton
    variant="rectangular"
    sx={{ width: '100%', height: '100%', ...sx }}
    aria-label="Loading image"
  />
);

const ImageError = ({ sx }: { sx?: SxProps<Theme> }) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...sx,
    }}
  >
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Box
        component="svg"
        sx={{ width: 48, height: 48, color: 'text.disabled', mx: 'auto', mb: 1 }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        Failed to load image
      </Typography>
    </Box>
  </Box>
);

export function OptimizedImage({
  src,
  alt,
  sx,
  width,
  height,
  fill = false,
  priority = false,
  objectFit = 'cover',
  sizes,
  quality = 90,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return <ImageError sx={sx} />;
  }

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', ...(fill && { width: '100%', height: '100%' }), ...sx }}>
      {isLoading && <ImageSkeleton sx={fill ? { position: 'absolute', inset: 0 } : undefined} />}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        style={{
          transition: 'opacity 0.3s',
          opacity: isLoading ? 0 : 1,
          objectFit: fill ? objectFit : undefined,
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </Box>
  );
}

// Hero Image variant with overlay and content
interface HeroImageProps extends Omit<OptimizedImageProps, 'fill'> {
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
}

export function HeroImage({
  overlay = true,
  overlayOpacity = 40,
  children,
  sx,
  className,
  ...props
}: HeroImageProps) {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, ...sx }} className={className}>
      <OptimizedImage {...props} fill sx={{ width: '100%', height: '100%' }} />
      {overlay && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            opacity: overlayOpacity / 100,
          }}
        />
      )}
      {children && <Box sx={{ position: 'absolute', inset: 0, zIndex: 10 }}>{children}</Box>}
    </Box>
  );
}
