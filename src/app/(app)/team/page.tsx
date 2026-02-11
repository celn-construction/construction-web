'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '~/trpc/react';
import { canInviteMembers } from '~/lib/permissions';
import { Button } from '@/components/ui/button';
import InviteDialog from '@/components/team/InviteDialog';
import MembersList from '@/components/team/MembersList';
import PendingInvitesList from '@/components/team/PendingInvitesList';

export default function TeamPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');

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

  const pendingCount = invitations.filter((inv) => inv.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Team</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {organization?.name || 'Manage your team members and invitations'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'members'
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Members ({members.length})
            {activeTab === 'members' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
              />
            )}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'pending'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Pending ({pendingCount})
              {activeTab === 'pending' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'members' ? (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4"
          >
            <MembersList members={members} isLoading={membersLoading} />
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4"
          >
            {pendingCount > 0 ? (
              <PendingInvitesList
                invitations={invitations}
                isLoading={invitationsLoading}
                organizationId={organizationId}
                canManage={canManage}
              />
            ) : (
              <p className="text-center text-[var(--text-muted)] py-8">
                No pending invitations
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Dialog */}
      {canManage && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          organizationId={organizationId}
        />
      )}
    </motion.div>
  );
}
