'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { useSnackbar } from '@/hooks/useSnackbar';
import RoleSelect from './RoleSelect';
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from '@/lib/validations/invitation';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  projectId: string;
}

export default function InviteDialog({
  open,
  onOpenChange,
  organizationId,
  projectId,
}: InviteDialogProps) {
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();

  const { data: projects = [] } = api.project.list.useQuery(
    { organizationId },
    { enabled: open && !!organizationId },
  );

  // Initialize form with react-hook-form + zod
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      organizationId,
      projectId,
      email: '',
      role: 'member',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ organizationId, projectId, email: '', role: 'member' });
    }
  }, [open, organizationId, projectId, reset]);

  const createInvitation = api.invitation.create.useMutation({
    onSuccess: () => {
      showSnackbar('Invitation sent successfully', 'success');
      void utils.invitation.list.invalidate();
      void utils.projectMember.listProjectMemberships.invalidate();
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to send invitation', 'error');
    },
  });

  const onSubmit = (data: CreateInvitationInput) => {
    createInvitation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'action.hover',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserPlus size={20} style={{ color: 'var(--text-primary)' }} />
          </Box>
          <DialogTitle sx={{ p: 0 }}>Invite Team Member</DialogTitle>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send an invitation to join any project in this organization
        </Typography>

        <DialogContent sx={{ p: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    placeholder="member@example.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                  />
                )}
              />

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Project
                </Typography>
                <Controller
                  name="projectId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <Select
                        {...field}
                        displayEmpty
                        sx={{ '& .MuiSelect-select': { py: 1.25 } }}
                      >
                        {projects.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                {errors.projectId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.projectId.message}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Role
                </Typography>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <RoleSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                {errors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.role.message}
                  </Typography>
                )}
              </Box>
            </Box>
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 0, pt: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            loading={createInvitation.isPending}
            loadingPosition="start"
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
