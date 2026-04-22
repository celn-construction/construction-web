'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Minus, Plus, CheckCircle, CircleDashed, FloppyDisk, X } from '@phosphor-icons/react';
import { DEFAULT_REQUIRED_COUNT } from '@/lib/constants/requirements';

interface RequirementCounterProps {
  current: number;
  required: number | null;
  canManage: boolean;
  onSave: (count: number | null) => void;
  isPending?: boolean;
  folderColor: string;
}

export default function RequirementCounter({
  current,
  required,
  canManage,
  onSave,
  isPending,
  folderColor,
}: RequirementCounterProps) {
  const [draft, setDraft] = useState<number | null>(required);

  // Sync draft when server value changes
  useEffect(() => {
    setDraft(required);
  }, [required]);

  const isDirty = draft !== required;

  // ── Null state: no requirement set ──
  if (required === null && draft === null) {
    if (!canManage) return null;

    return (
      <Box
        component="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setDraft(DEFAULT_REQUIRED_COUNT);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          ml: 'auto',
          py: '3px',
          px: '8px',
          borderRadius: '6px',
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
          '&:hover': {
            borderColor: folderColor,
            bgcolor: `${folderColor}08`,
          },
        }}
      >
        <CircleDashed
          size={11}
          color="var(--text-secondary)"
          style={{ flexShrink: 0 }}
        />
        <Typography
          sx={{
            fontSize: '0.5625rem',
            fontWeight: 500,
            color: 'text.secondary',
            lineHeight: 1,
          }}
        >
          Set requirement
        </Typography>
      </Box>
    );
  }

  // Use draft for display (allows unsaved preview)
  const displayCount = draft ?? required ?? DEFAULT_REQUIRED_COUNT;
  const isFulfilled = current >= displayCount;
  const isPartial = current > 0 && !isFulfilled;

  const statusColor = isFulfilled
    ? 'var(--status-green)'
    : isPartial
      ? folderColor
      : 'var(--text-secondary)';

  return (
    <Box
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        flex: 1,
        minWidth: 0,
        ml: 0.5,
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Segmented progress */}
      <Box sx={{ display: 'flex', gap: '2px', flex: 1, alignItems: 'center', minWidth: 0 }}>
        {Array.from({ length: Math.min(displayCount, 10) }).map((_, i) => (
          <Box
            key={i}
            sx={{
              height: 3.5,
              flex: 1,
              maxWidth: 16,
              borderRadius: '1.5px',
              bgcolor: i < current ? statusColor : 'action.selected',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
        {displayCount > 10 && (
          <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled', lineHeight: 1, flexShrink: 0 }}>
            +{displayCount - 10}
          </Typography>
        )}
      </Box>

      {/* Count + status icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
        {isFulfilled ? (
          <CheckCircle size={11} weight="fill" color="var(--status-green)" />
        ) : null}
        <Typography
          sx={{
            fontSize: '0.5625rem',
            fontWeight: 600,
            color: isFulfilled ? 'success.main' : 'text.secondary',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {current}/{displayCount}
        </Typography>
      </Box>

      {/* Admin stepper + save */}
      {canManage && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '5px',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <IconButton
              size="small"
              disabled={isPending || displayCount <= 1}
              onClick={() => setDraft(displayCount - 1)}
              sx={{
                p: 0,
                width: 18,
                height: 18,
                borderRadius: 0,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                '&.Mui-disabled': { color: 'action.disabled' },
              }}
              aria-label="Decrease required count"
            >
              <Minus size={9} weight="bold" />
            </IconButton>
            <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />
            <IconButton
              size="small"
              disabled={isPending || displayCount >= 50}
              onClick={() => setDraft(displayCount + 1)}
              sx={{
                p: 0,
                width: 18,
                height: 18,
                borderRadius: 0,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                '&.Mui-disabled': { color: 'action.disabled' },
              }}
              aria-label="Increase required count"
            >
              <Plus size={9} weight="bold" />
            </IconButton>
          </Box>

          {/* Save / Cancel — appear when dirty */}
          {isDirty && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
              <Box
                component="button"
                disabled={isPending}
                onClick={() => onSave(draft)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  px: '5px',
                  height: 18,
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  lineHeight: 1,
                  color: 'white',
                  bgcolor: folderColor,
                  transition: 'filter 0.15s',
                  flexShrink: 0,
                  '&:hover': { filter: 'brightness(1.1)' },
                  '&:disabled': { opacity: 0.5, cursor: 'default' },
                }}
                aria-label="Save requirement"
              >
                <FloppyDisk size={9} weight="bold" />
                Save
              </Box>
              <Box
                component="button"
                onClick={() => setDraft(required)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '5px',
                  border: 'none',
                  bgcolor: 'action.selected',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'action.focus', color: 'text.primary' },
                }}
                aria-label="Cancel"
              >
                <X size={10} weight="bold" />
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
