'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Typography, CircularProgress, Collapse } from '@mui/material';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/user';
import UserAvatar from '@/components/ui/UserAvatar';
import AvatarPicker from '@/components/ui/AvatarPicker';

export default function ProfileTabContent() {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();
  const { data: user, isLoading } = api.user.me.useQuery();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', phone: '', image: '' },
  });

  const watchedImage = watch('image');

  useEffect(() => {
    if (user) {
      reset({ name: user.name ?? '', phone: user.phone ?? '', image: user.image ?? '' });
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
          onClick={() => setShowAvatarPicker((prev) => !prev)}
          sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 }, transition: 'opacity 0.15s' }}
        >
          <UserAvatar
            image={watchedImage || user?.image}
            name={user?.name}
            size={64}
            borderRadius="14px"
            fontSize="1.125rem"
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {user?.name ?? 'User'}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.3, mt: 0.25 }}>
            {user?.email}
          </Typography>
          <Typography
            onClick={() => setShowAvatarPicker((prev) => !prev)}
            sx={{
              fontSize: '0.75rem',
              color: 'primary.main',
              cursor: 'pointer',
              mt: 0.5,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {showAvatarPicker ? 'Hide avatars' : 'Change avatar'}
          </Typography>
        </Box>
      </Box>

      <Collapse in={showAvatarPicker}>
        <Box sx={{ pb: 1 }}>
          <AvatarPicker
            value={watchedImage || undefined}
            onChange={(url) => {
              setValue('image', url, { shouldDirty: true });
            }}
          />
        </Box>
      </Collapse>

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
