'use client';

import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '~/trpc/react';
import { Button } from '@/components/ui/button';

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

  const revokeInvitation = api.invitation.revoke.useMutation({
    onSuccess: () => {
      toast.success('Invitation revoked');
      void utils.invitation.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke invitation');
    },
  });

  const resendInvitation = api.invitation.resend.useMutation({
    onSuccess: () => {
      toast.success('Invitation resent');
      void utils.invitation.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resend invitation');
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
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-11 h-11 rounded-full bg-[var(--bg-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--bg-hover)] rounded w-1/3" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-1/4" />
            </div>
            <div className="h-6 bg-[var(--bg-hover)] rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.04,
          },
        },
      }}
      className="space-y-2"
    >
      {pendingInvitations.map((invitation) => (
        <motion.div
          key={invitation.id}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          className="flex items-center gap-3 p-3.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          {/* Avatar placeholder */}
          <div className="w-11 h-11 rounded-full bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-[var(--text-muted)]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[var(--text-primary)] truncate">
              {invitation.email}
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              {formatRole(invitation.role)} • Sent {formatDate(invitation.createdAt)}
            </div>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  resendInvitation.mutate({
                    organizationId,
                    invitationId: invitation.id,
                  })
                }
                loading={resendInvitation.isPending}
              >
                Resend
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  revokeInvitation.mutate({
                    organizationId,
                    invitationId: invitation.id,
                  })
                }
                loading={revokeInvitation.isPending}
                className="text-[var(--status-red)] hover:text-[var(--status-red)]"
              >
                Revoke
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
