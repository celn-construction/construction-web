'use client';

import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';

export function useInvitationActions() {
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

  return {
    revokeInvitation,
    resendInvitation,
    isRevoking: revokeInvitation.isPending,
    isResending: resendInvitation.isPending,
  };
}
