'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  quality?: number;
}

const ImageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-800', className)} aria-label="Loading image">
    <div className="w-full h-full flex items-center justify-center">
      <svg
        className="w-12 h-12 text-gray-400 dark:text-gray-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  </div>
);

const ImageError = ({ className }: { className?: string }) => (
  <div className={cn('bg-gray-100 dark:bg-gray-900 flex items-center justify-center', className)}>
    <div className="text-center p-4">
      <svg
        className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2"
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
      </svg>
      <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load image</p>
    </div>
  </div>
);

export function OptimizedImage({
  src,
  alt,
  className,
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

  const containerClass = cn(
    'relative overflow-hidden',
    fill ? 'w-full h-full' : '',
    className
  );

  if (hasError) {
    return <ImageError className={containerClass} />;
  }

  return (
    <div className={containerClass}>
      {isLoading && <ImageSkeleton className={fill ? 'absolute inset-0' : className} />}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill ? `object-${objectFit}` : ''
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Hero Image variant with overlay and content
interface HeroImageProps extends Omit<OptimizedImageProps, 'fill'> {
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function HeroImage({
  overlay = true,
  overlayOpacity = 40,
  children,
  className,
  ...props
}: HeroImageProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <OptimizedImage {...props} fill className="w-full h-full" />
      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}
      {children && <div className="absolute inset-0 z-10">{children}</div>}
    </div>
  );
}
