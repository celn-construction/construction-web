'use client';

import {
  Box,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import ProjectFormBody from '@/components/projects/ProjectFormBody';

interface CreateProjectFormProps {
  orgSlug: string;
  orgName: string;
  organizationId: string;
}

export default function CreateProjectForm({
  orgSlug,
  orgName,
  organizationId,
}: CreateProjectFormProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Header accent bar */}
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.3)})`,
        }}
      />

      <Box sx={{ p: 3.5 }}>
        <ProjectFormBody
          orgSlug={orgSlug}
          organizationId={organizationId}
          title="Create Your First Project"
          subtitle={`Set up a project for ${orgName} to start tracking tasks and timelines.`}
          replaceOnNavigate
        />
      </Box>
    </Paper>
  );
}
