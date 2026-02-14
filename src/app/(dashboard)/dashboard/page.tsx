'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { api } from '@/trpc/react';
import AddProjectDialog from '@/components/projects/AddProjectDialog';
import { Box, Typography } from '@mui/material';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery();

  // Auto-open dialog when no projects exist
  useEffect(() => {
    if (!projectsLoading && projects.length === 0) {
      setAddProjectOpen(true);
    }
  }, [projects, projectsLoading]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography variant="h5" color="text.secondary">
          Dashboard (Gantt component removed)
        </Typography>
      </Box>
      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </>
  );
}
