'use client';

import { Box, Typography, Skeleton } from '@mui/material';
import { X, CalendarBlank, Timer } from '@phosphor-icons/react';
import type { Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import CsiCodeSelector from '@/components/bryntum/components/CsiCodeSelector';

function getStatusInfo(percentDone: number, palette: Theme['palette']) {
  if (percentDone >= 100) {
    return { dotColor: palette.status.active };
  }
  if (percentDone > 0) {
    return { dotColor: palette.status.inProgress };
  }
  return { dotColor: palette.text.disabled };
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(duration: number | null | undefined, unit: string): string {
  if (!duration) return '';
  const rounded = Math.round(duration);
  const u = unit === 'day' ? 'day' : unit;
  return `${rounded} ${u}${rounded !== 1 ? 's' : ''}`;
}

interface TaskHeaderProps {
  taskName: string;
  taskId?: string;
  organizationId: string;
  projectId: string;
  taskDetail: {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    duration?: number | null;
    durationUnit?: string;
    csiCode?: string | null;
    percentDone?: number;
  } | null | undefined;
  taskDetailLoading: boolean;
  onClose: () => void;
}

export default function TaskHeader({
  taskName,
  taskId,
  organizationId,
  projectId,
  taskDetail,
  taskDetailLoading,
  onClose,
}: TaskHeaderProps) {
  const theme = useTheme();
  const percentDone = taskDetail?.percentDone ?? 0;
  const statusInfo = getStatusInfo(percentDone, theme.palette);

  const metaDateRange = [
    taskDetail?.startDate ? formatDate(taskDetail.startDate) : null,
    taskDetail?.endDate ? formatDate(taskDetail.endDate) : null,
  ]
    .filter(Boolean)
    .join(' — ');

  const durationLabel = formatDuration(
    taskDetail?.duration,
    taskDetail?.durationUnit ?? 'day'
  );

  return (
    <Box sx={{ p: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {/* Title row */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9375rem',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: 'text.primary',
              wordBreak: 'break-word',
            }}
          >
            {taskName}
          </Typography>
          {taskDetailLoading ? (
            <>
              <Skeleton variant="text" width={140} height={14} sx={{ borderRadius: '4px' }} />
              <Skeleton variant="rounded" width={110} height={20} sx={{ borderRadius: '6px' }} />
            </>
          ) : (
            <>
              {(metaDateRange || durationLabel) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  {metaDateRange && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarBlank size={12} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
                        {metaDateRange}
                      </Typography>
                    </Box>
                  )}
                  {metaDateRange && durationLabel && (
                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                  )}
                  {durationLabel && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Timer size={12} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
                        {durationLabel}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              {taskId && (
                <CsiCodeSelector
                  csiCode={taskDetail?.csiCode}
                  organizationId={organizationId}
                  projectId={projectId}
                  taskId={taskId}
                />
              )}
            </>
          )}
        </Box>

        {/* Close button */}
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.secondary',
            flexShrink: 0,
            mt: '1px',
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            transition: 'background-color 0.15s, color 0.15s',
          }}
          aria-label="Close"
        >
          <X size={13} />
        </Box>
      </Box>

      {/* Progress bar */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            Progress
          </Typography>
          {taskDetailLoading ? (
            <Skeleton variant="text" width={24} height={12} sx={{ borderRadius: '3px' }} />
          ) : (
            <Typography
              sx={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(percentDone)}%
            </Typography>
          )}
        </Box>
        {taskDetailLoading ? (
          <Skeleton variant="rounded" width="100%" height={4} sx={{ borderRadius: '999px' }} />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 4,
              borderRadius: '999px',
              bgcolor: 'rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                borderRadius: '999px',
                bgcolor: statusInfo.dotColor,
                width: `${Math.min(percentDone, 100)}%`,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
