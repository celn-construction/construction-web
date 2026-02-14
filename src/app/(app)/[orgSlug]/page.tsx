'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Box, Typography, Button, Paper, Skeleton } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { api } from '~/trpc/react';
import AddProjectDialog from '~/components/projects/AddProjectDialog';
import { formatDistanceToNow } from 'date-fns';

export default function OrgHomePage() {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: projects, isLoading } = api.project.list.useQuery();

  const handleCardClick = (slug: string) => {
    router.push(`/${orgSlug}/projects/${slug}/dashboard`);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Skeleton width={200} height={40} />
            <Skeleton width={300} height={24} sx={{ mt: 1 }} />
          </Box>
          <Skeleton width={140} height={48} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // No projects state
  if (!projects || projects.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          p: 3,
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

        <AddProjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </Box>
    );
  }

  // Projects list state
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your organization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => handleCardClick(project.slug)}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                    {project.name}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: project.status === 'ACTIVE' ? 'success.main' :
                               project.status === 'PLANNING' ? 'info.main' :
                               project.status === 'COMPLETED' ? 'grey.500' : 'warning.main',
                      color: 'white',
                    }}
                  >
                    {project.status === 'ACTIVE' ? (
                      <CheckCircle size={14} />
                    ) : project.status === 'PLANNING' ? (
                      <Clock size={14} />
                    ) : (
                      <Calendar size={14} />
                    )}
                    <Typography variant="caption" fontWeight={500}>
                      {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  {project.startDate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {new Date(project.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {project.endDate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {new Date(project.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <AddProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Box>
  );
}
