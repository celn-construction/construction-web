'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { api } from '@/trpc/react';
import { canInviteMembers } from '@/lib/permissions';
import InviteDialog from '@/components/team/InviteDialog';
import MembersList from '@/components/team/MembersList';
import PendingInvitesList from '@/components/team/PendingInvitesList';
import { useProjectContext } from '@/components/providers/ProjectProvider';

type TeamTab = 'members' | 'pending';

export default function TeamPage() {
  const theme = useTheme();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamTab>('members');

  const { projectId, projectName, organizationId } = useProjectContext();

  const { data: members = [], isLoading: membersLoading } = api.projectMember.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: invitations = [], isLoading: invitationsLoading } =
    api.invitation.list.useQuery({ projectId }, { enabled: !!projectId });

  const { data: currentUser } = api.user.me.useQuery();

  const currentMembership = members.find((m) => m.user.id === currentUser?.id);
  const canManage = currentMembership ? canInviteMembers(currentMembership.role) : false;

  const pendingCount = invitations.filter((inv) => inv.status === 'pending').length;

  useEffect(() => {
    if (pendingCount === 0 && activeTab === 'pending') {
      setActiveTab('members');
    }
  }, [pendingCount, activeTab]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ p: 3, maxWidth: 800, mx: 'auto' }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Team
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {projectName}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1, borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.875rem' },
          }}
        >
          <Tab label={`Members (${members.length})`} value="members" />
          {pendingCount > 0 && <Tab label={`Pending (${pendingCount})`} value="pending" />}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
        }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <Box component={motion.div} key="members"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              sx={{ p: 2 }}>
              {canManage && (
                <Box onClick={() => setInviteDialogOpen(true)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.75, mb: 1.5, borderRadius: '12px', cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PlusCircle size={20} weight="light" color={theme.palette.primary.main} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                    Invite Member
                  </Typography>
                </Box>
              )}
              <MembersList members={members} isLoading={membersLoading} />
            </Box>
          )}

          {activeTab === 'pending' && (
            <Box component={motion.div} key="pending"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              sx={{ p: 2 }}>
              {pendingCount > 0 ? (
                <PendingInvitesList invitations={invitations} isLoading={invitationsLoading}
                  projectId={projectId} canManage={canManage} />
              ) : (
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                  No pending invitations
                </Typography>
              )}
            </Box>
          )}
        </AnimatePresence>
      </Paper>

      {/* Invite Dialog */}
      {canManage && (
        <InviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}
          organizationId={organizationId} projectId={projectId} />
      )}
    </Box>
  );
}
