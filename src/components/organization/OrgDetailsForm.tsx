'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { IBeamLoader } from '@/components/ui/IBeamLoader';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from '@/lib/validations/organization';
import { COMPANY_TYPES } from '@/lib/constants/companyTypes';
import OrgLogoUploader from './OrgLogoUploader';

interface OrgDetailsFormProps {
  organizationId: string;
  canEdit: boolean;
}

const emptyDefaults: UpdateOrganizationInput = {
  name: '',
  companyType: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  licenseNumber: '',
  logoUrl: undefined,
};

export default function OrgDetailsForm({ organizationId, canEdit }: OrgDetailsFormProps) {
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();

  const { data: org, isLoading } = api.organization.getById.useQuery({ organizationId });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (org) {
      reset(
        {
          name: org.name ?? '',
          companyType: org.companyType ?? '',
          phone: org.phone ?? '',
          website: org.website ?? '',
          address: org.address ?? '',
          city: org.city ?? '',
          state: org.state ?? '',
          zip: org.zip ?? '',
          licenseNumber: org.licenseNumber ?? '',
          logoUrl: org.logoUrl ?? undefined,
        },
        { keepDirtyValues: true },
      );
    }
  }, [org, reset]);

  const updateOrg = api.organization.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.organization.getById.invalidate({ organizationId }),
        utils.organization.list.invalidate(),
      ]);
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to update organization', 'error');
    },
  });

  const handleSave = handleSubmit(async (data) => {
    await updateOrg.mutateAsync({ ...data, organizationId });
    showSnackbar('Organization updated', 'success');
  });

  const handleLogoUpload = async (url: string) => {
    await updateOrg.mutateAsync({ organizationId, logoUrl: url });
    reset((prev) => ({ ...prev, logoUrl: url }), { keepDirty: true, keepDirtyValues: true });
    showSnackbar('Logo updated', 'success');
  };

  if (isLoading || !org) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <IBeamLoader size={28} />
      </Box>
    );
  }

  const watchedLogoUrl = watch('logoUrl');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Logo + name row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <OrgLogoUploader
          name={org.name}
          seed={org.slug ?? org.id}
          logoUrl={watchedLogoUrl || org.logoUrl}
          disabled={!canEdit}
          onUpload={handleLogoUpload}
          onError={(msg) => showSnackbar(msg, 'error')}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {org.name}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', lineHeight: 1.3 }}>
            {canEdit ? 'Click the logo to upload a new image.' : 'View-only — only owners can edit.'}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="Company name"
              fullWidth
              size="small"
              disabled={!canEdit}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <Controller
          name="companyType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth size="small" disabled={!canEdit} error={!!errors.companyType}>
              <InputLabel id="company-type-label">Company type</InputLabel>
              <Select
                labelId="company-type-label"
                label="Company type"
                {...field}
                value={field.value ?? ''}
              >
                {COMPANY_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="Phone"
              fullWidth
              size="small"
              disabled={!canEdit}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          )}
        />

        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="Website"
              placeholder="https://example.com"
              fullWidth
              size="small"
              disabled={!canEdit}
              error={!!errors.website}
              helperText={errors.website?.message}
            />
          )}
        />

        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="Street address"
              fullWidth
              size="small"
              disabled={!canEdit}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="City"
                fullWidth
                size="small"
                disabled={!canEdit}
                error={!!errors.city}
                helperText={errors.city?.message}
              />
            )}
          />
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="State"
                size="small"
                disabled={!canEdit}
                error={!!errors.state}
                helperText={errors.state?.message}
                sx={{ width: 110 }}
              />
            )}
          />
          <Controller
            name="zip"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="ZIP"
                size="small"
                disabled={!canEdit}
                error={!!errors.zip}
                helperText={errors.zip?.message}
                sx={{ width: 130 }}
              />
            )}
          />
        </Box>

        <Controller
          name="licenseNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="License number"
              fullWidth
              size="small"
              disabled={!canEdit}
              error={!!errors.licenseNumber}
              helperText={errors.licenseNumber?.message}
            />
          )}
        />

        {canEdit && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={!isDirty}
              loading={updateOrg.isPending}
            >
              Save changes
            </Button>
          </Box>
        )}
      </form>
    </Box>
  );
}
