'use client';

import { Warning, Buildings, Envelope, Clock } from '@phosphor-icons/react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';

interface RemoveFromOrgDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
  userRole: string;
  /** Number of projects this user is currently a member of in this org. */
  projectCount: number;
}

export default function RemoveFromOrgDialog({
  open,
  onClose,
  organizationId,
  organizationName,
  userId,
  userName,
  userRole,
  projectCount,
}: RemoveFromOrgDialogProps) {
  const theme = useTheme();
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();

  const removeMutation = api.member.remove.useMutation({
    onSuccess: () => {
      showSnackbar(`Removed ${userName} from ${organizationName}`, 'success');
      void utils.member.list.invalidate();
      void utils.projectMember.list.invalidate();
      void utils.projectMember.listProjectMemberships.invalidate();
      void utils.invitation.list.invalidate();
      onClose();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to remove member', 'error');
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.error.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.error.main,
            }}
          >
            <Warning size={20} weight="fill" />
          </Box>
          <DialogTitle sx={{ p: 0, fontSize: '1rem', fontWeight: 600 }}>
            Remove from {organizationName}?
          </DialogTitle>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary' }}>
            {userName}
          </Typography>
          <Box
            sx={{
              px: 0.875,
              py: 0.125,
              borderRadius: '999px',
              fontSize: '0.625rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              bgcolor: 'action.hover',
              color: 'text.secondary',
              border: `1px solid ${theme.palette.divider}`,
              whiteSpace: 'nowrap',
            }}
          >
            {userRole}
          </Box>
        </Box>

        <DialogContent sx={{ p: 0, mt: 2 }}>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1.5 }}>
            This will:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: 'action.hover',
            }}
          >
            <Consequence
              icon={<Buildings size={14} weight="bold" />}
              text={
                projectCount === 0
                  ? 'Remove their organization access'
                  : projectCount === 1
                    ? 'Remove them from 1 project in this organization'
                    : `Remove them from ${projectCount} projects in this organization`
              }
            />
            <Consequence
              icon={<Envelope size={14} weight="bold" />}
              text="Revoke any pending invitations sent to their email"
            />
            <Consequence
              icon={<Clock size={14} weight="bold" />}
              text="Take effect immediately — they will lose access right away"
            />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 1.5 }}>
            They can be re-invited later.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 0, pt: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={removeMutation.isPending}
            onClick={() => removeMutation.mutate({ organizationId, userId })}
          >
            Remove from organization
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function Consequence({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ color: 'text.secondary', mt: '2px', flexShrink: 0 }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', lineHeight: 1.4 }}>
        {text}
      </Typography>
    </Box>
  );
}
