'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '~/trpc/react';
import { canInviteMembers } from '~/lib/permissions';
import { Button } from '@/components/ui/button';
import InviteDialog from '@/components/team/InviteDialog';
import MembersList from '@/components/team/MembersList';
import PendingInvitesList from '@/components/team/PendingInvitesList';

export default function TeamPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: organization } = api.organization.getCurrent.useQuery();
  const organizationId = organization?.id || '';

  const { data: members = [], isLoading: membersLoading } = api.member.list.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  const { data: invitations = [], isLoading: invitationsLoading } =
    api.invitation.list.useQuery({ organizationId }, { enabled: !!organizationId });

  const { data: currentUser } = api.user.me.useQuery();

  const currentMembership = members.find(
    (m) => m.user.id === currentUser?.id
  );
  const canManage = currentMembership ? canInviteMembers(currentMembership.role) : false;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Team</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage your team members and invitations
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        )}
      </div>

      {/* Current Members */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Members ({members.length})
        </h2>
        <MembersList members={members} isLoading={membersLoading} />
      </div>

      {/* Pending Invitations */}
      {invitations.filter((inv) => inv.status === 'pending').length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            Pending Invitations
          </h2>
          <PendingInvitesList
            invitations={invitations}
            isLoading={invitationsLoading}
            organizationId={organizationId}
            canManage={canManage}
          />
        </div>
      )}

      {/* Invite Dialog */}
      {canManage && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
