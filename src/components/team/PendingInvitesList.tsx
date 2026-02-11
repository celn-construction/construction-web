'use client';

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
            className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
          >
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
    <div className="space-y-2">
      {pendingInvitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
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
        </div>
      ))}
    </div>
  );
}
