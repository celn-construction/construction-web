'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, FolderKanban, Users, CheckSquare, FileText } from 'lucide-react';
import { Box, Typography, Button, Paper, Skeleton } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { api } from '@/trpc/react';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

export default function OrgHomePage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get organization ID from the org list
  const { data: orgs, isLoading: orgsLoading, isError: orgsError } = api.organization.list.useQuery();
  const currentOrg = orgs?.find(org => org.slug === orgSlug);

  // Fetch stats for the current organization
  const { data: stats, isLoading: statsLoading, isError: statsError } = api.organization.stats.useQuery(
    { organizationId: currentOrg?.id ?? '' },
    { enabled: !!currentOrg?.id }
  );

  const isLoading = orgsLoading || (!!currentOrg && statsLoading);

  if (orgsError || statsError) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="error">Failed to load dashboard. Please refresh the page or sign in again.</Typography>
      </Box>
    );
  }

  if (!orgsLoading && !currentOrg) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary">Organization not found.</Typography>
      </Box>
    );
  }

  if (isLoading || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Skeleton width={200} height={40} />
          <Skeleton width={140} height={48} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const statCards = [
    { label: 'Projects', value: stats.projectCount, icon: FolderKanban, color: 'primary.main' },
    { label: 'Team Members', value: stats.memberCount, icon: Users, color: 'success.main' },
    { label: 'Tasks', value: stats.taskCount, icon: CheckSquare, color: 'info.main' },
    { label: 'Documents', value: stats.documentCount, icon: FileText, color: 'warning.main' },
  ];

  // Empty state (no projects)
  const hasNoProjects = stats.projectCount === 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600} color="text.primary">
          Organization Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: hasNoProjects ? 4 : 0 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <stat.icon size={28} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={700} color="text.primary">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {hasNoProjects && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 6,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 6,
              maxWidth: 500,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Create Your First Project
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Get started by creating your first project. Projects help you organize
              tasks, track timelines, and collaborate with your team.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Plus />}
              onClick={() => setDialogOpen(true)}
            >
              Create Project
            </Button>
          </Paper>
        </Box>
      )}

      <AddProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Box>
  );
}
