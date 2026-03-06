'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Box, Typography, Paper } from '@mui/material';
import { Button } from '@/components/ui/button';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

export default function CreateFirstProject() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
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
          variant="default"
          size="lg"
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
