'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Tabs, Tab, Paper, Button } from '@mui/material';
import { api } from '~/trpc/react';
import { canInviteMembers } from '~/lib/permissions';
import InviteDialog from '@/components/team/InviteDialog';
import MembersList from '@/components/team/MembersList';
import PendingInvitesList from '@/components/team/PendingInvitesList';
import { useOrgContext } from '@/components/providers/OrgProvider';

export default function TeamPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');

  const { orgId: organizationId, orgName } = useOrgContext();

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
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{
        p: 3,
        maxWidth: 800,
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Team
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
            {orgName}
          </Typography>
        </Box>
        {canManage && (
          <Button
            variant="contained"
            onClick={() => setInviteDialogOpen(true)}
            startIcon={<UserPlus size={16} />}
          >
            Invite
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab label={`Members (${members.length})`} value="members" />
          {pendingCount > 0 && (
            <Tab label={`Pending (${pendingCount})`} value="pending" />
          )}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'members' ? (
          <Paper
            component={motion.div}
            key="members"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            <MembersList members={members} isLoading={membersLoading} />
          </Paper>
        ) : (
          <Paper
            component={motion.div}
            key="pending"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            {pendingCount > 0 ? (
              <PendingInvitesList
                invitations={invitations}
                isLoading={invitationsLoading}
                organizationId={organizationId}
                canManage={canManage}
              />
            ) : (
              <Typography
                sx={{
                  textAlign: 'center',
                  color: 'text.disabled',
                  py: 4,
                }}
              >
                No pending invitations
              </Typography>
            )}
          </Paper>
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
    </Box>
  );
}
