'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Typography, CircularProgress } from '@mui/material';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/user';
import { getInitials } from '@/lib/utils/formatting';

export default function ProfileTabContent() {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const { data: user, isLoading } = api.user.me.useQuery();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name ?? '', phone: user.phone ?? '' });
    }
  }, [user, reset]);

  const updateProfile = api.user.update.useMutation({
    onSuccess: () => {
      showSnackbar('Profile updated', 'success');
      void utils.user.me.invalidate();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to update profile', 'error');
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Avatar + identity */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '14px',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.accent.dark}, ${theme.palette.accent.gradientEnd})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'common.white',
            letterSpacing: '0.02em',
          }}
        >
          {getInitials(user?.name)}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {user?.name ?? 'User'}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.3, mt: 0.25 }}>
            {user?.email}
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <form
        onSubmit={handleSubmit((data) => updateProfile.mutate(data))}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              fullWidth
              size="small"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <TextField
          label="Email"
          value={user?.email ?? ''}
          fullWidth
          size="small"
          disabled
          helperText="Email cannot be changed"
        />

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Phone"
              fullWidth
              size="small"
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          )}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
            Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : ''}
          </Typography>

          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={!isDirty}
            loading={updateProfile.isPending}
          >
            Save changes
          </Button>
        </Box>
      </form>
    </Box>
  );
}
