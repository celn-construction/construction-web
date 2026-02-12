'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { api } from '~/trpc/react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useSnackbar } from '@/hooks/useSnackbar';
import RoleSelect from './RoleSelect';
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from '~/lib/validations/invitation';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export default function InviteDialog({
  open,
  onOpenChange,
  organizationId,
}: InviteDialogProps) {
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();

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
      email: '',
      role: 'member',
    },
  });

  const createInvitation = api.invitation.create.useMutation({
    onSuccess: () => {
      showSnackbar('Invitation sent successfully', 'success');
      void utils.invitation.list.invalidate();
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
              borderRadius: 2,
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
          Send an invitation to join your organization
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
            disabled={createInvitation.isPending}
            startIcon={createInvitation.isPending ? <CircularProgress size={16} /> : null}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
