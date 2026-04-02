'use client';

import { useState, useEffect } from 'react';
import { Trash, Warning, PlusCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { api } from '@/trpc/react';
import { canInviteMembers, canDeleteProjects } from '@/lib/permissions';
import InviteDialog from '@/components/team/InviteDialog';
import MembersList from '@/components/team/MembersList';
import PendingInvitesList from '@/components/team/PendingInvitesList';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';
import { Button } from '@/components/ui/button';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useOrgContext } from '@/components/providers/OrgProvider';

type ManageTab = 'members' | 'pending' | 'settings';

export default function ManagePage() {
  const theme = useTheme();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ManageTab>('members');

  const { projectId, projectName, organizationId } = useProjectContext();
  const { orgId } = useOrgContext();

  const { data: members = [], isLoading: membersLoading } = api.projectMember.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: invitations = [], isLoading: invitationsLoading } =
    api.invitation.list.useQuery({ projectId }, { enabled: !!projectId });

  const { data: currentUser } = api.user.me.useQuery();

  const currentMembership = members.find(
    (m) => m.user.id === currentUser?.id
  );
  const canManage = currentMembership ? canInviteMembers(currentMembership.role) : false;
  const canDelete = currentMembership ? canDeleteProjects(currentMembership.role) : false;

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
            Manage
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
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
          <Tab label="Settings" value="settings" />
        </Tabs>
      </Box>

      {/* Tab Content — shared wrapper prevents layout shift */}
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: activeTab === 'settings' ? alpha(theme.palette.error.main, 0.3) : 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
        }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <Box
              component={motion.div}
              key="members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              sx={{ p: 2 }}
            >
              {canManage && (
                <Box
                  onClick={() => setInviteDialogOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.75,
                    mb: 1.5,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
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
            <Box
              component={motion.div}
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              sx={{ p: 2 }}
            >
              {pendingCount > 0 ? (
                <PendingInvitesList
                  invitations={invitations}
                  isLoading={invitationsLoading}
                  projectId={projectId}
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
            </Box>
          )}

          {activeTab === 'settings' && (
            <Box
              component={motion.div}
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {canDelete ? (
                <>
                  {/* Danger Zone header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 1.5,
                      bgcolor: alpha(theme.palette.error.main, 0.04),
                      borderBottom: '1px solid',
                      borderColor: alpha(theme.palette.error.main, 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Warning size={14} color={theme.palette.error.main} />
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'error.main',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Danger Zone
                    </Typography>
                  </Box>

                  {/* Delete project row */}
                  <Box
                    sx={{
                      px: 3,
                      py: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 0.25,
                        }}
                      >
                        Delete this project
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          color: 'text.secondary',
                          lineHeight: 1.5,
                        }}
                      >
                        Permanently delete this project and all its data. This cannot be undone.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                      startIcon={<Trash size={14} />}
                      sx={{
                        flexShrink: 0,
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        textTransform: 'none',
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography sx={{ color: 'text.disabled', fontSize: '0.875rem', p: 2 }}>
                  Only project owners and admins can manage project settings.
                </Typography>
              )}
            </Box>
          )}
        </AnimatePresence>
      </Paper>

      {/* Invite Dialog */}
      {canManage && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          organizationId={organizationId}
          projectId={projectId}
        />
      )}

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={projectId ? { id: projectId, name: projectName } : null}
      />
    </Box>
  );
}
