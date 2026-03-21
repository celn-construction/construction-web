'use client';

import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Box, Typography, Stack, Skeleton } from '@mui/material';
import Button from '@/components/ui/button';
import { useInvitationActions } from '@/hooks/useInvitationActions';
import { formatRole } from '@/lib/utils/formatting';

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
  projectId: string;
  canManage: boolean;
}

export default function PendingInvitesList({
  invitations,
  isLoading,
  projectId,
  canManage,
}: PendingInvitesListProps) {
  const { revokeInvitation, resendInvitation, isRevoking, isResending } = useInvitationActions();

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return null;
  }

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
                loading={isResending}
                loadingPosition="start"
                onClick={() =>
                  resendInvitation.mutate({
                    projectId,
                    invitationId: invitation.id,
                  })
                }
              >
                Resend
              </Button>
              <Button
                variant="text"
                size="small"
                loading={isRevoking}
                loadingPosition="start"
                onClick={() =>
                  revokeInvitation.mutate({
                    projectId,
                    invitationId: invitation.id,
                  })
                }
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
