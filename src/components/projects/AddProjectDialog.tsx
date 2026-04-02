'use client';

import {
  Box,
  Dialog,
  alpha,
  useTheme,
} from '@mui/material';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import ProjectFormBody from '@/components/projects/ProjectFormBody';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProjectDialog({
  open,
  onOpenChange,
}: AddProjectDialogProps) {
  const theme = useTheme();
  const { orgSlug, activeOrganizationId } = useOrgFromUrl();

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 440,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: `0 24px 64px -16px ${alpha('#000', 0.2)}, 0 8px 20px -8px ${alpha('#000', 0.08)}`,
        },
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
          organizationId={activeOrganizationId}
          title="New Project"
          subtitle="Set up a new construction project"
          onCancel={handleClose}
          onSuccess={handleClose}
        />
      </Box>
    </Dialog>
  );
}
