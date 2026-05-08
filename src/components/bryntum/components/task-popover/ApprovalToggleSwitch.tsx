'use client';

import { useState } from 'react';
import { Box, Popover, Tooltip, Typography, CircularProgress, Button } from '@mui/material';
import { Check } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { canApproveDocuments } from '@/lib/permissions';
import type { ApprovedByUser } from './types';

type ApprovalStatus = 'approved' | 'unapproved' | string;
type Size = 'sm' | 'md';

interface ApprovalToggleSwitchProps {
  documentId: string;
  documentName: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: ApprovedByUser | null;
  organizationId: string;
  memberRole: string;
  size?: Size;
}

const SIZES: Record<Size, { trackW: number; trackH: number; thumb: number; offset: number }> = {
  sm: { trackW: 26, trackH: 16, thumb: 12, offset: 10 },
  md: { trackW: 32, trackH: 18, thumb: 14, offset: 14 },
};

export default function ApprovalToggleSwitch({
  documentId,
  documentName,
  approvalStatus,
  approvedBy,
  organizationId,
  size = 'sm',
  memberRole,
}: ApprovalToggleSwitchProps) {
  const canApprove = canApproveDocuments(memberRole);
  const [optimistic, setOptimistic] = useState<ApprovalStatus | null>(null);
  const [confirmAnchor, setConfirmAnchor] = useState<HTMLElement | null>(null);

  const utils = api.useUtils();
  const setStatusMutation = api.approval.setStatus.useMutation({
    onSuccess: () => {
      void utils.approval.listAll.invalidate();
      void utils.approval.summary.invalidate();
      void utils.document.search.invalidate();
      void utils.document.aiSearch.invalidate();
      void utils.document.listByFolder.invalidate();
      void utils.document.listByTask.invalidate();
    },
    onError: () => setOptimistic(null),
  });

  const effectiveStatus = optimistic ?? approvalStatus;
  const isApproved = effectiveStatus === 'approved';
  const isPending = setStatusMutation.isPending;
  const dims = SIZES[size];

  // ── Read-only badge for non-approvers ──
  if (!canApprove) {
    const tooltip = isApproved
      ? approvedBy?.name
        ? `Approved by ${approvedBy.name}`
        : 'Approved by an admin'
      : 'Awaiting approval from an admin';

    return (
      <Tooltip title={tooltip} arrow disableInteractive>
        <Box
          component="span"
          aria-label={isApproved ? 'Approved' : 'Awaiting approval'}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 600,
            color: isApproved ? 'success.main' : 'text.secondary',
            userSelect: 'none',
            lineHeight: 1.2,
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isApproved ? 'success.main' : 'action.selected',
              color: isApproved ? 'success.contrastText' : 'text.disabled',
            }}
          >
            {isApproved ? (
              <Check size={9} weight="bold" />
            ) : (
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'currentColor' }} />
            )}
          </Box>
          {isApproved ? 'Approved' : 'Pending'}
        </Box>
      </Tooltip>
    );
  }

  // ── Interactive toggle for approvers ──
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    if (isApproved) {
      // Un-approve: one-click flip, no confirm
      setOptimistic('unapproved');
      setStatusMutation.mutate({
        documentId,
        organizationId,
        approved: false,
      });
    } else {
      // Approve: open confirm popover anchored to the toggle
      setConfirmAnchor(e.currentTarget);
    }
  };

  const handleConfirm = () => {
    setConfirmAnchor(null);
    setOptimistic('approved');
    setStatusMutation.mutate({
      documentId,
      organizationId,
      approved: true,
    });
  };

  const handleCancel = () => setConfirmAnchor(null);

  const tooltipText = isPending
    ? 'Saving…'
    : isApproved
      ? 'Approved · click to unapprove'
      : 'Click to approve';

  return (
    <>
      <Tooltip title={tooltipText} arrow disableInteractive>
        {/* span wrapper so Tooltip still receives mouse events when the button is disabled */}
        <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>
        <Box
          component="button"
          type="button"
          role="switch"
          aria-checked={isApproved}
          aria-label={isApproved ? 'Mark as unapproved' : 'Approve document'}
          onClick={handleClick}
          disabled={isPending}
          sx={{
            position: 'relative',
            flexShrink: 0,
            width: dims.trackW,
            height: dims.trackH,
            borderRadius: '999px',
            border: '1px solid',
            borderColor: isApproved ? 'success.main' : 'divider',
            bgcolor: isApproved ? 'success.main' : 'action.selected',
            cursor: isPending ? 'progress' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
            p: 0,
            outline: 'none',
            boxShadow: confirmAnchor ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none',
            '&:hover': isPending
              ? {}
              : isApproved
                ? { bgcolor: 'success.dark', borderColor: 'success.dark' }
                : { borderColor: 'success.main' },
            '&:focus-visible': { boxShadow: '0 0 0 3px rgba(22,163,74,0.3)' },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 1,
              transform: `translateY(-50%) translateX(${isApproved ? dims.offset : 0}px)`,
              width: dims.thumb,
              height: dims.thumb,
              borderRadius: '50%',
              bgcolor: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.20)',
              transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPending && (
              <CircularProgress
                size={dims.thumb - 4}
                thickness={6}
                sx={{ color: 'success.main' }}
              />
            )}
          </Box>
        </Box>
        </Box>
      </Tooltip>

      <Popover
        open={!!confirmAnchor}
        anchorEl={confirmAnchor}
        onClose={handleCancel}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: '14px 16px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
              width: 240,
            },
          },
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
          Approve this submittal?
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: 'text.secondary',
            mb: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={documentName}
        >
          {documentName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCancel}
            sx={{ fontSize: 11, py: 0.5, px: 1.25, minWidth: 0, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={handleConfirm}
            sx={{ fontSize: 11, py: 0.5, px: 1.5, minWidth: 0, textTransform: 'none' }}
          >
            Approve
          </Button>
        </Box>
      </Popover>
    </>
  );
}
