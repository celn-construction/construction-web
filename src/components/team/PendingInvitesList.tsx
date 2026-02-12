'use client';

import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '~/trpc/react';
import { Box, Typography, Stack, Skeleton, Button, CircularProgress } from '@mui/material';
import { useSnackbar } from '@/hooks/useSnackbar';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

interface PendingInvitesListProps {
  invitations: Invitation[];
  isLoading: boolean;
  organizationId: string;
  canManage: boolean;
}

export default function PendingInvitesList({
  invitations,
  isLoading,
  organizationId,
  canManage,
}: PendingInvitesListProps) {
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();

  const revokeInvitation = api.invitation.revoke.useMutation({
    onSuccess: () => {
      showSnackbar('Invitation revoked', 'success');
      void utils.invitation.list.invalidate();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to revoke invitation', 'error');
    },
  });

  const resendInvitation = api.invitation.resend.useMutation({
    onSuccess: () => {
      showSnackbar('Invitation resent', 'success');
      void utils.invitation.list.invalidate();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to resend invitation', 'error');
    },
  });

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return null;
  }

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        {[1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.75,
              borderRadius: 2,
            }}
          >
            <Skeleton variant="circular" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="33%" height={16} sx={{ mb: 0.5 }} />
              <Skeleton width="25%" height={12} />
            </Box>
            <Skeleton width={80} height={24} />
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.04,
          },
        },
      }}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {pendingInvitations.map((invitation) => (
        <Box
          key={invitation.id}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.75,
            borderRadius: 2,
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Mail size={20} style={{ color: 'var(--text-disabled)' }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {invitation.email}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {formatRole(invitation.role)} • Sent {formatDate(invitation.createdAt)}
            </Typography>
          </Box>

          {canManage && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="text"
                size="small"
                onClick={() =>
                  resendInvitation.mutate({
                    organizationId,
                    invitationId: invitation.id,
                  })
                }
                disabled={resendInvitation.isPending}
                startIcon={resendInvitation.isPending ? <CircularProgress size={14} /> : null}
              >
                Resend
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() =>
                  revokeInvitation.mutate({
                    organizationId,
                    invitationId: invitation.id,
                  })
                }
                disabled={revokeInvitation.isPending}
                startIcon={revokeInvitation.isPending ? <CircularProgress size={14} /> : null}
                sx={{ color: 'text.secondary' }}
              >
                Revoke
              </Button>
            </Stack>
          )}
        </Box>
      ))}
    </Box>
  );
}
