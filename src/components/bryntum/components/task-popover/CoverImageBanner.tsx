'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ImageSquare, PushPin } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import type { DocumentItem } from './types';

interface CoverImageBannerProps {
  taskId?: string;
  projectId: string;
  organizationId: string;
  coverDocumentId: string | null;
  photos: DocumentItem[];
}

const STRIP_MAX = 5;
const HERO_HEIGHT = 160;
const THUMB_SIZE = 44;
const EMPTY_HEIGHT = HERO_HEIGHT + 4 + THUMB_SIZE;

export default function CoverImageBanner({
  taskId,
  projectId,
  organizationId,
  coverDocumentId,
  photos,
}: CoverImageBannerProps) {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const pinMutation = api.gantt.pinPhoto.useMutation({
    onSuccess: () => {
      if (taskId) {
        void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
      }
    },
    onError: (err) => showSnackbar(err.message || 'Failed to pin photo', 'error'),
  });

  // Reset local "viewed" state when task or pinned photo changes
  useEffect(() => {
    setViewedId(null);
    setHeroLoaded(false);
  }, [taskId, coverDocumentId]);

  // Order photos: pinned first, then newest-first. `photos` arrives newest-first from listByTask.
  const orderedPhotos = useMemo(() => {
    if (!coverDocumentId) return photos;
    const pinned = photos.find((p) => p.id === coverDocumentId);
    if (!pinned) return photos;
    return [pinned, ...photos.filter((p) => p.id !== coverDocumentId)];
  }, [photos, coverDocumentId]);

  const defaultHero = orderedPhotos[0] ?? null;
  const hero = viewedId
    ? (orderedPhotos.find((p) => p.id === viewedId) ?? defaultHero)
    : defaultHero;

  const stripPhotos = orderedPhotos.filter((p) => p.id !== hero?.id);
  const visibleStrip = stripPhotos.slice(0, STRIP_MAX);
  const overflowCount = stripPhotos.length - visibleStrip.length;

  const handlePin = useCallback(
    (documentId: string) => {
      if (!taskId) return;
      pinMutation.mutate({ projectId, taskId, documentId });
    },
    [taskId, projectId, pinMutation]
  );

  // Empty state: no photos yet — show guidance pointing to the Photos folder
  if (photos.length === 0) {
    return (
      <Box
        sx={{
          mx: '14px',
          mb: '4px',
          height: EMPTY_HEIGHT,
          borderRadius: '10px',
          border: '1.5px dashed',
          borderColor: 'divider',
          color: 'text.disabled',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          textAlign: 'center',
          px: 3,
        }}
      >
        <ImageSquare size={18} />
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1.2 }}>
          No cover image
        </Typography>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 400, color: 'text.disabled', lineHeight: 1.4, maxWidth: 260 }}>
          Upload a photo in the Photos folder below, then pin it to feature it here.
        </Typography>
      </Box>
    );
  }

  const isPinned = hero?.id === coverDocumentId;

  return (
    <Box sx={{ mx: '14px', mb: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* ─── HERO ─── */}
      <Box
        sx={{
          position: 'relative',
          height: HERO_HEIGHT,
          borderRadius: '10px',
          overflow: 'hidden',
          bgcolor: 'background.default',
          '&:hover .hero-actions': { opacity: 1 },
        }}
      >
        {hero ? (
          <>
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
              key={hero.id}
              src={hero.blobUrl}
              alt={hero.name}
              onLoad={() => setHeroLoaded(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Pinned badge (visible always when showing the pinned photo) */}
            {isPinned && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  height: 22,
                  px: 0.75,
                  bgcolor: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                <PushPin size={11} weight="fill" />
                Pinned
              </Box>
            )}

            {/* Hover actions: pin only (no uploads from here) */}
            {!isPinned && hero && (
              <Box
                className="hero-actions"
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
                  disabled={pinMutation.isPending}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handlePin(hero.id);
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
                    '&:disabled': { opacity: 0.6, cursor: 'wait' },
                    transition: 'background-color 0.15s',
                  }}
                  aria-label="Pin as cover"
                >
                  <PushPin size={12} weight="fill" />
                  Pin as cover
                </Box>
              </Box>
            )}
          </>
        ) : null}
      </Box>

      {/* ─── THUMBNAIL STRIP ─── */}
      {visibleStrip.length > 0 && (
        <Box sx={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>
          {visibleStrip.map((photo, idx) => {
            const isOverflowTile = idx === visibleStrip.length - 1 && overflowCount > 0;
            return (
              <Box
                key={photo.id}
                onClick={() => setViewedId(photo.id)}
                sx={{
                  position: 'relative',
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  bgcolor: 'action.hover',
                  border: '2px solid',
                  borderColor: 'transparent',
                  transition: 'border-color 0.15s, transform 0.15s',
                  '&:hover': { borderColor: 'divider', transform: 'scale(1.03)' },
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.blobUrl}
                  alt={photo.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {photo.id === coverDocumentId && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                    }}
                  >
                    <PushPin size={8} weight="fill" />
                  </Box>
                )}
                {isOverflowTile && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0,0,0,0.55)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    +{overflowCount + 1}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
