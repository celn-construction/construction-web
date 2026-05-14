'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Divider,
  FormControl,
  MenuItem,
  Popover,
  Select,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { formatRole } from '@/lib/utils/formatting';

interface ProjectMembershipPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  memberId: string;
  projectId: string;
  projectName: string;
  userName: string;
  /** The user's role on this specific project. */
  role: string;
}

const ELEVATED_ROLES = new Set(['owner', 'admin']);
const EDITABLE_ROLES = ['admin', 'member'] as const;
type EditableRole = (typeof EDITABLE_ROLES)[number];

export default function ProjectMembershipPopover({
  anchorEl,
  onClose,
  memberId,
  projectId,
  projectName,
  userName,
  role: initialRole,
}: ProjectMembershipPopoverProps) {
  const theme = useTheme();
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();

  const [currentRole, setCurrentRole] = useState(initialRole);

  useEffect(() => {
    setCurrentRole(initialRole);
  }, [initialRole, anchorEl]);

  const updateMutation = api.projectMember.updateRole.useMutation({
    onSuccess: () => {
      showSnackbar(`Role updated for ${userName}`, 'success');
      void utils.projectMember.list.invalidate();
      void utils.projectMember.listProjectMemberships.invalidate();
    },
    onError: (error) => {
      setCurrentRole(initialRole);
      showSnackbar(error.message || 'Failed to update role', 'error');
    },
  });

  const removeMutation = api.projectMember.remove.useMutation({
    onSuccess: () => {
      showSnackbar(`Removed ${userName} from ${projectName}`, 'success');
      void utils.projectMember.list.invalidate();
      void utils.projectMember.listProjectMemberships.invalidate();
      onClose();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to remove member', 'error');
    },
  });

  const handleRoleChange = (newRole: string) => {
    if (newRole === currentRole) return;
    setCurrentRole(newRole);
    updateMutation.mutate({
      projectId,
      memberId,
      role: newRole as EditableRole,
    });
  };

  const isElevated = ELEVATED_ROLES.has(currentRole);
  const roleBadgeStyle = isElevated
    ? {
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }
    : {
        bgcolor: 'action.hover',
        color: 'text.secondary',
        border: `1px solid ${theme.palette.divider}`,
      };

  const isOwnerRole = currentRole === 'owner';

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            p: 2,
            width: 320,
            borderRadius: '12px',
            border: 1,
            borderColor: 'divider',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.05)',
          },
        },
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
        Manage on {projectName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 200,
          }}
        >
          {userName}
        </Typography>
        <Box
          sx={{
            px: 0.875,
            py: 0.125,
            borderRadius: '999px',
            fontSize: '0.625rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            ...roleBadgeStyle,
          }}
        >
          {formatRole(currentRole)}
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'text.secondary',
            mb: 0.75,
          }}
        >
          Role on this project
        </Typography>
        {isOwnerRole ? (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
            Project owners can&apos;t be reassigned here.
          </Typography>
        ) : (
          <FormControl fullWidth size="small">
            <Select
              value={currentRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={updateMutation.isPending}
              sx={{ '& .MuiSelect-select': { py: 1, fontSize: '0.8125rem' } }}
            >
              {EDITABLE_ROLES.map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: '0.8125rem' }}>
                  {formatRole(r)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
        They can be re-invited later.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
        <Button variant="outlined" size="small" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          loading={removeMutation.isPending}
          onClick={() => removeMutation.mutate({ memberId, projectId })}
        >
          Remove from project
        </Button>
      </Box>
    </Popover>
  );
}
