'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, alpha, useTheme } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUp } from '@phosphor-icons/react';
import { format, differenceInCalendarDays, isToday, isTomorrow, isYesterday } from 'date-fns';

interface SlotDropzoneProps {
  slotNum: number;
  label: string;
  folderColor: string;
  /** Slot due date (raw — the component owns formatting). */
  dueDate: Date | string | null;
  /** When true, the date chip is interactive (click → date input). */
  canEditDueDate: boolean;
  /** Called when the user picks or clears a due date (yyyy-MM-dd or null). */
  onSetDueDate?: (dueDate: string | null) => void;
  onClick: () => void;
  /**
   * Called when a file is dropped on the row. Omit to disable DnD (the row
   * still works as click-to-upload). The parent is expected to route through
   * trackUpload + /api/upload bound to this slot.
   */
  onDropFile?: (file: File) => void;
  /**
   * When true the row renders an in-place "Uploading…" state — spinner badge,
   * disabled click + drop, no hover. Pairs with the global upload chip so the
   * user can see which slot the active upload is landing in.
   */
  isUploading?: boolean;
}

interface DueState {
  /** Short label for the chip — "Jun 15", "in 2 days", "3 days late", etc. */
  label: string;
  /** Color treatment: muted (future), amber (soon), red (overdue). */
  tone: 'muted' | 'soon' | 'overdue';
}

function describeDueDate(dueDate: Date): DueState {
  const now = new Date();
  const diff = differenceInCalendarDays(dueDate, now);

  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      label: isYesterday(dueDate) ? 'yesterday' : `${days} ${days === 1 ? 'day' : 'days'} late`,
      tone: 'overdue',
    };
  }
  if (isToday(dueDate)) return { label: 'today', tone: 'soon' };
  if (isTomorrow(dueDate)) return { label: 'tomorrow', tone: 'soon' };
  if (diff <= 3) return { label: `in ${diff} days`, tone: 'soon' };
  return { label: format(dueDate, 'MMM d'), tone: 'muted' };
}

function SlotDropzoneInner({
  slotNum,
  label,
  folderColor,
  dueDate,
  canEditDueDate,
  onSetDueDate,
  onClick,
  onDropFile,
  isUploading = false,
}: SlotDropzoneProps) {
  const theme = useTheme();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      const f = accepted[0];
      if (f && onDropFile) onDropFile(f);
    },
    maxFiles: 1,
    noClick: true, // we own the click — opens the dialog (title + notes)
    noKeyboard: true,
    disabled: !onDropFile || isUploading,
  });

  // Derive due-date display from the raw value.
  const parsedDue = dueDate ? (typeof dueDate === 'string' ? new Date(dueDate) : dueDate) : null;
  const dueState = parsedDue ? describeDueDate(parsedDue) : null;
  const isOverdue = dueState?.tone === 'overdue';

  // Inline date-input editor — mirrors the SubmittalDrawer pattern.
  const [editingDue, setEditingDue] = useState(false);
  const [draftDue, setDraftDue] = useState(parsedDue ? format(parsedDue, 'yyyy-MM-dd') : '');
  const dueInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingDue) return;
    setDraftDue(parsedDue ? format(parsedDue, 'yyyy-MM-dd') : '');
  }, [parsedDue, editingDue]);

  const commitDue = () => {
    const next = draftDue || null;
    const current = parsedDue ? format(parsedDue, 'yyyy-MM-dd') : null;
    if (next !== current) onSetDueDate?.(next);
    setEditingDue(false);
  };

  const openDueEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditDueDate || !onSetDueDate) return;
    setEditingDue(true);
    requestAnimationFrame(() => dueInputRef.current?.focus());
  };

  // Visual states:
  // Resting: no border, action.hover bg, quiet badge.
  // Hover:   dashed accent outline.
  // Drag:    solid folderColor outline + alpha bg + scaled badge/icon.
  // Overdue: badge tinted with error.main @12%, date text red.
  const dragBg = alpha(folderColor, 0.08);
  const dragRing = alpha(folderColor, 0.18);

  const badgeBg = isDragActive
    ? folderColor
    : isOverdue
      ? alpha(theme.palette.error.main, 0.12)
      : alpha(folderColor, 0.1);
  const badgeColor = isDragActive ? '#fff' : isOverdue ? theme.palette.error.main : folderColor;

  const dueToneColor =
    dueState?.tone === 'overdue'
      ? 'error.main'
      : dueState?.tone === 'soon'
        ? 'warning.dark'
        : 'text.secondary';

  return (
    <Box
      {...(onDropFile && !isUploading ? getRootProps() : {})}
      onClick={isUploading ? undefined : onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: '5px',
        minHeight: 32,
        borderRadius: '8px',
        cursor: isUploading ? 'default' : 'pointer',
        bgcolor: isUploading ? alpha(folderColor, 0.06) : isDragActive ? dragBg : 'action.hover',
        // Use outline instead of border so the row doesn't reflow between states.
        outline: '1.5px solid transparent',
        outlineOffset: '-1.5px',
        boxShadow: isDragActive ? `0 0 0 3px ${dragRing}` : 'none',
        transition: 'background-color 0.15s, box-shadow 0.15s, outline-color 0.15s',
        ...(isUploading
          ? {}
          : isDragActive
            ? {
                outlineColor: folderColor,
                outlineStyle: 'solid',
              }
            : {
                '&:hover': {
                  outlineStyle: 'dashed',
                  outlineColor: theme.palette.divider,
                },
              }),
      }}
    >
      {onDropFile && !isUploading && <input {...getInputProps()} />}

      {/* Slot number badge — overdue tints it red. While uploading, the badge
          becomes a spinner so the user can see which slot the active upload
          is landing in. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          bgcolor: isUploading ? alpha(folderColor, 0.12) : badgeBg,
          color: isUploading ? folderColor : badgeColor,
          flexShrink: 0,
          transform: isDragActive ? 'scale(1.05)' : 'none',
          transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
        }}
      >
        {isUploading ? (
          <CircularProgress size={10} thickness={6} sx={{ color: folderColor }} />
        ) : (
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 600,
              lineHeight: 1,
              color: 'inherit',
            }}
          >
            {slotNum}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'inline-flex',
          flexShrink: 0,
          color: isUploading || isDragActive ? folderColor : 'text.secondary',
          transform: isDragActive ? 'scale(1.1)' : 'none',
          transition: 'color 0.15s, transform 0.15s',
        }}
      >
        <CloudArrowUp size={14} weight={isUploading || isDragActive ? 'fill' : 'regular'} />
      </Box>

      <Typography
        sx={{
          fontSize: 11,
          color: isUploading || isDragActive ? folderColor : 'text.secondary',
          fontWeight: isUploading || isDragActive ? 500 : 400,
          lineHeight: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flex: 1,
          transition: 'color 0.15s',
        }}
      >
        {isUploading ? `Uploading ${label}…` : isDragActive ? `Drop to upload ${label}` : label}
      </Typography>

      {/* Due-date column — 4 states (editing | with date | no date + editor | nothing). */}
      {editingDue ? (
        <Box
          component="input"
          ref={dueInputRef}
          type="date"
          value={draftDue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftDue(e.target.value)}
          onBlur={commitDue}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDue();
            } else if (e.key === 'Escape') {
              setDraftDue(parsedDue ? format(parsedDue, 'yyyy-MM-dd') : '');
              setEditingDue(false);
            }
          }}
          sx={{
            fontFamily: 'inherit',
            fontSize: 11,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '6px',
            bgcolor: 'background.paper',
            color: 'text.primary',
            px: 0.75,
            py: 0.25,
            outline: 'none',
            flexShrink: 0,
            '&:focus': { borderColor: folderColor },
          }}
        />
      ) : dueState ? (
        <Box
          component={canEditDueDate ? 'button' : 'span'}
          onClick={canEditDueDate ? openDueEditor : undefined}
          sx={{
            fontSize: 10.5,
            color: dueToneColor,
            fontWeight: dueState.tone === 'muted' ? 400 : 500,
            lineHeight: 1,
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            p: 0,
            cursor: canEditDueDate ? 'pointer' : 'default',
            transition: 'color 0.15s',
            '&:hover': canEditDueDate ? { color: 'text.primary' } : undefined,
          }}
          aria-label={canEditDueDate ? `Edit due date (currently ${dueState.label})` : undefined}
        >
          {dueState.label}
        </Box>
      ) : canEditDueDate ? (
        <Box
          component="button"
          onClick={openDueEditor}
          sx={{
            fontSize: 9.5,
            color: 'text.disabled',
            lineHeight: 1,
            flexShrink: 0,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '5px',
            bgcolor: 'transparent',
            fontFamily: 'inherit',
            px: 0.625,
            py: 0.25,
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
            '&:hover': { color: 'text.secondary', borderColor: 'text.disabled' },
          }}
          aria-label="Add due date"
        >
          + due date
        </Box>
      ) : null}
    </Box>
  );
}

const SlotDropzone = React.memo(SlotDropzoneInner);
export default SlotDropzone;
