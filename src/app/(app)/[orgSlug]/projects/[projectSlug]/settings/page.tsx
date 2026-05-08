'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Trash, Warning, Swatches, CaretDown,
  Image as ImageIcon, UploadSimple, X, FloppyDisk,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import {
  Autocomplete as MuiAutocomplete,
  Box, Typography, Paper, Popover, TextField,
  CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import Script from 'next/script';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';
import { api } from '@/trpc/react';
import { canDeleteProjects, canManageProjects } from '@/lib/permissions';
import { updateProjectSchema, type UpdateProjectInput } from '@/lib/validations/project';
import { PROJECT_ICON_OPTIONS, getProjectIcon } from '@/lib/constants/projectIconComponents';
import ProjectAvatar from '@/components/ui/ProjectAvatar';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';
import { Button } from '@/components/ui/button';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useSnackbar } from '@/hooks/useSnackbar';
import { env } from '@/env';

const GOOGLE_PLACES_API_KEY = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

// ---------------------------------------------------------------------------
// Location fields (reused from ProjectFormBody patterns)
// ---------------------------------------------------------------------------

function LocationAutocompleteField({
  value, onChange, error, helperText,
}: { value: string; onChange: (v: string) => void; error?: boolean; helperText?: string }) {
  const {
    ready,
    suggestions: { data },
    setValue: setSearchValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ requestOptions: { types: ['address'] }, debounce: 300 });

  const [options, setOptions] = useState<string[]>([]);

  const handleInputChange = useCallback(
    (_e: React.SyntheticEvent, v: string) => { setSearchValue(v); onChange(v); },
    [setSearchValue, onChange],
  );

  useEffect(() => { setOptions(data.map((s) => s.description)); }, [data]);

  const handleSelect = useCallback(
    async (_e: React.SyntheticEvent, v: string | null) => {
      if (v) { onChange(v); clearSuggestions(); try { await getGeocode({ address: v }); } catch { /* ok */ } }
      else { onChange(''); }
    },
    [onChange, clearSuggestions],
  );

  return (
    <MuiAutocomplete
      freeSolo options={options} inputValue={value}
      onInputChange={handleInputChange} onChange={handleSelect}
      disabled={!ready} filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField {...params} label="Location" placeholder="e.g. 123 Main St, New York, NY"
          error={error} helperText={helperText} fullWidth />
      )}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '8px', mt: 0.5,
            boxShadow: `0 8px 24px ${alpha('#000', 0.12)}`,
            '& .MuiAutocomplete-option': { fontSize: '0.875rem', py: 1, px: 1.75 },
          },
        },
      }}
    />
  );
}

function PlainLocationField({
  value, onChange, error, helperText,
}: { value: string; onChange: (v: string) => void; error?: boolean; helperText?: string }) {
  return (
    <TextField value={value} onChange={(e) => onChange(e.target.value)}
      label="Location" placeholder="e.g. 123 Main St, New York, NY" error={error} helperText={helperText}
      fullWidth autoComplete="off" />
  );
}

// ---------------------------------------------------------------------------
// Settings Form
// ---------------------------------------------------------------------------

function ProjectSettingsForm({
  projectId, organizationId,
}: { projectId: string; organizationId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams<{ orgSlug: string; projectSlug: string }>();
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();
  const { projectName, projectIcon, projectImageUrl, projectLocation } = useProjectContext();

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [pickerMode, setPickerMode] = useState<'icon' | 'photo'>(projectImageUrl ? 'photo' : 'icon');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [iconAnchorEl, setIconAnchorEl] = useState<HTMLElement | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors, isDirty } } =
    useForm<UpdateProjectInput>({
      resolver: zodResolver(updateProjectSchema),
      defaultValues: {
        name: projectName,
        location: projectLocation,
        icon: (projectIcon ?? 'building') as UpdateProjectInput['icon'],
        imageUrl: projectImageUrl ?? undefined,
      },
    });

  const selectedIcon = watch('icon') ?? 'building';
  const imageUrl = watch('imageUrl');
  const displayImageUrl = previewUrl ?? imageUrl;
  const SelectedIconComponent = getProjectIcon(selectedIcon);
  const selectedIconLabel = PROJECT_ICON_OPTIONS.find(o => o.id === selectedIcon)?.label ?? 'Building';

  const imageChanged = imageUrl !== (projectImageUrl ?? undefined);

  const cleanupUploadedImage = useCallback((url?: string) => {
    const urlToDelete = url ?? uploadedUrlRef.current;
    if (urlToDelete && organizationId) {
      void fetch('/api/project/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlToDelete, organizationId }),
      }).catch(() => {});
      uploadedUrlRef.current = null;
    }
  }, [organizationId]);

  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) {
        const urlToDelete = uploadedUrlRef.current;
        if (urlToDelete && organizationId) {
          void fetch('/api/project/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: urlToDelete, organizationId }),
          }).catch(() => {});
        }
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMutation = api.project.update.useMutation({
    onSuccess: (updated) => {
      showSnackbar('Project updated', 'success');
      uploadedUrlRef.current = null;
      void utils.project.list.invalidate();
      void utils.project.getActive.invalidate();
      void utils.project.getBySlug.invalidate();
      if (updated.slug !== params.projectSlug) {
        router.replace(`/${params.orgSlug}/projects/${updated.slug}/settings`);
      }
    },
    onError: (err) => {
      showSnackbar(err.message || 'Failed to update project', 'error');
    },
  });

  const onSubmit = (data: UpdateProjectInput) => {
    updateMutation.mutate({ ...data, projectId });
  };

  const handlePhotoDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !organizationId) return;
    setIsUploading(true);
    setUploadError(null);
    const localPreview = URL.createObjectURL(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      const res = await fetch('/api/project/image', { method: 'POST', body: formData });
      if (!res.ok) {
        URL.revokeObjectURL(localPreview);
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Upload failed');
      }
      const d = await res.json() as { imageUrl: string };
      if (uploadedUrlRef.current) cleanupUploadedImage(uploadedUrlRef.current);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localPreview;
      });
      uploadedUrlRef.current = d.imageUrl;
      setValue('imageUrl', d.imageUrl, { shouldDirty: true });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [organizationId, setValue, cleanupUploadedImage]);

  const handleRemovePhoto = useCallback(() => {
    if (uploadedUrlRef.current) cleanupUploadedImage();
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setValue('imageUrl', undefined, { shouldDirty: true });
    setUploadError(null);
  }, [setValue, cleanupUploadedImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1, maxSize: 5 * 1024 * 1024, disabled: isUploading,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === 'file-too-large') setUploadError('File size exceeds 5MB limit');
      else if (error?.code === 'file-invalid-type') setUploadError('Only image files are allowed');
      else setUploadError('File not accepted');
    },
  });

  const handleSwitchToIcon = useCallback(() => {
    setPickerMode('icon');
    setUploadError(null);
    if (uploadedUrlRef.current) {
      cleanupUploadedImage();
      setValue('imageUrl', undefined, { shouldDirty: true });
    }
  }, [setValue, cleanupUploadedImage]);

  const handleSwitchToPhoto = useCallback(() => {
    setPickerMode('photo');
    setUploadError(null);
  }, []);

  const useGooglePlaces = !!GOOGLE_PLACES_API_KEY && scriptLoaded;
  const hasChanges = isDirty || imageChanged;

  return (
    <>
      {GOOGLE_PLACES_API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`}
          strategy="lazyOnload"
          onReady={() => setScriptLoaded(true)}
        />
      )}

      <Box sx={{ px: 3, py: 2.5 }}>
        {/* Preview */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '12px',
            bgcolor: displayImageUrl ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
            border: displayImageUrl ? 'none' : `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
          }}>
            <ProjectAvatar
              imageUrl={displayImageUrl}
              icon={selectedIcon}
              size={displayImageUrl ? 48 : 24}
              borderRadius="12px"
              color={theme.palette.primary.main}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
              Project Details
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mt: 0.25 }}>
              Update your project name, location, and image
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)} id="settings-form">
          {/* Picker Mode Toggle */}
          <Box
            role="radiogroup" aria-label="Project image type"
            sx={{
              display: 'inline-flex', borderRadius: '8px',
              bgcolor: alpha(theme.palette.divider, 0.08), p: '3px', mb: 1.5,
            }}
          >
            {(['icon', 'photo'] as const).map((mode) => {
              const isActive = pickerMode === mode;
              const Icon = mode === 'icon' ? Swatches : ImageIcon;
              return (
                <Box key={mode} component="button" type="button" role="radio"
                  aria-checked={isActive}
                  onClick={mode === 'icon' ? handleSwitchToIcon : handleSwitchToPhoto}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    px: 1.5, py: 0.625, borderRadius: '6px', border: 'none',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    fontFamily: 'inherit', letterSpacing: '0.02em',
                    transition: 'all 0.15s ease',
                    bgcolor: isActive ? 'background.paper' : 'transparent',
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    boxShadow: isActive ? `0 1px 3px ${alpha('#000', 0.08)}` : 'none',
                    '&:hover': {
                      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    },
                  }}
                >
                  <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                  {mode === 'icon' ? 'Icon' : 'Photo'}
                </Box>
              );
            })}
          </Box>

          {/* Icon Picker (dropdown) */}
          {pickerMode === 'icon' && (
            <Controller name="icon" control={control} render={({ field }) => (
              <>
                <Box
                  component="button" type="button"
                  onClick={(e: React.MouseEvent<HTMLElement>) => setIconAnchorEl(e.currentTarget)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 1, mb: 2.5, borderRadius: '8px',
                    border: '1.5px solid', borderColor: alpha(theme.palette.divider, 0.3),
                    bgcolor: alpha(theme.palette.divider, 0.06),
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      bgcolor: alpha(theme.palette.divider, 0.1),
                    },
                  }}
                >
                  <SelectedIconComponent size={18} weight="fill" />
                  {selectedIconLabel}
                  <CaretDown size={12} style={{ marginLeft: 'auto', color: theme.palette.text.secondary }} />
                </Box>
                <Popover
                  open={!!iconAnchorEl} anchorEl={iconAnchorEl}
                  onClose={() => setIconAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      sx: {
                        borderRadius: '10px', mt: 0.5, p: 1,
                        boxShadow: `0 8px 24px ${alpha('#000', 0.12)}`,
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                    {PROJECT_ICON_OPTIONS.map(({ id, label, Icon }) => {
                      const isSelected = (field.value ?? 'building') === id;
                      return (
                        <Tooltip key={id} title={label} arrow placement="top">
                          <Box component="button" type="button"
                            onClick={() => { field.onChange(id); setIconAnchorEl(null); }}
                            sx={{
                              width: 36, height: 36, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              borderRadius: '8px', border: '1.5px solid',
                              borderColor: isSelected ? theme.palette.primary.main : 'transparent',
                              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                              color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                              cursor: 'pointer', transition: 'all 0.15s ease', p: 0,
                              '&:hover': {
                                bgcolor: isSelected
                                  ? alpha(theme.palette.primary.main, 0.12)
                                  : alpha(theme.palette.divider, 0.12),
                                color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                              },
                            }}
                          >
                            <Icon size={18} weight={isSelected ? 'fill' : 'regular'} />
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Popover>
              </>
            )} />
          )}

          {/* Photo Picker */}
          {pickerMode === 'photo' && (
            <Box sx={{ mb: 2.5 }}>
              {displayImageUrl ? (
                <Box sx={{ position: 'relative', '&:hover .remove-photo-btn': { opacity: 1 } }}>
                  <Box component="img" src={displayImageUrl} alt="Project cover"
                    sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '10px' }} />
                  <IconButton className="remove-photo-btn" onClick={handleRemovePhoto}
                    aria-label="Remove uploaded photo"
                    sx={{
                      position: 'absolute', top: 6, right: 6,
                      bgcolor: alpha('#000', 0.5), '&:hover': { bgcolor: alpha('#000', 0.7) },
                      opacity: 0, transition: 'opacity 0.2s', color: 'white', p: 0.5,
                    }}>
                    <X size={14} />
                  </IconButton>
                </Box>
              ) : (
                <Box {...getRootProps()} aria-label="Upload project photo" aria-busy={isUploading}
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 0.75, py: 2.5,
                    border: '1.5px dashed',
                    borderColor: uploadError ? theme.palette.error.main
                      : isDragActive ? theme.palette.primary.main
                      : alpha(theme.palette.divider, 0.4),
                    borderRadius: '10px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                    opacity: isUploading ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isUploading ? alpha(theme.palette.divider, 0.4) : alpha(theme.palette.primary.main, 0.4),
                      bgcolor: isUploading ? 'transparent' : alpha(theme.palette.primary.main, 0.02),
                    },
                  }}>
                  <input {...getInputProps()} />
                  {isUploading ? <CircularProgress size={20} /> : <UploadSimple size={20} style={{ color: theme.palette.text.secondary }} />}
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                    {isUploading ? 'Uploading...' : isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    PNG, JPG, WebP up to 5MB
                  </Typography>
                </Box>
              )}
              {uploadError && (
                <Typography sx={{ fontSize: '0.75rem', color: 'error.main', mt: 0.75 }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          )}

          {/* Project Name */}
          <Controller name="name" control={control} render={({ field }) => (
            <TextField {...field} id="settings-name-input"
              label="Project Name"
              placeholder="e.g. Downtown Tower Construction"
              error={!!errors.name} helperText={errors.name?.message}
              fullWidth autoComplete="off" />
          )} />

          {/* Location */}
          <Box sx={{ mt: 2 }}>
          <Controller name="location" control={control} render={({ field }) =>
            useGooglePlaces ? (
              <LocationAutocompleteField value={field.value ?? ''} onChange={field.onChange}
                error={!!errors.location} helperText={errors.location?.message} />
            ) : (
              <PlainLocationField value={field.value ?? ''} onChange={field.onChange}
                error={!!errors.location} helperText={errors.location?.message} />
            )
          } />
          </Box>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
            <Button type="submit" form="settings-form" variant="contained"
              disabled={!hasChanges || isUploading}
              loading={updateMutation.isPending}
              startIcon={<FloppyDisk size={15} />}
              sx={{
                borderRadius: '8px', fontWeight: 600, fontSize: '0.8125rem',
                px: 2.5, py: 1, textTransform: 'none',
                boxShadow: `0 1px 3px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}` },
              }}>
              Save Changes
            </Button>
          </Box>
        </form>
      </Box>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function ProjectSettingsPage() {
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { projectId, projectName, organizationId } = useProjectContext();

  const { data: members = [] } = api.projectMember.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  const { data: currentUser } = api.user.me.useQuery();
  const currentMembership = members.find((m) => m.user.id === currentUser?.id);
  const canDelete = currentMembership ? canDeleteProjects(currentMembership.role) : false;
  const canEdit = currentMembership ? canManageProjects(currentMembership.role) : false;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ p: 3, maxWidth: 800, mx: 'auto' }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Project Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {projectName}
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
        }}
      >
        {/* Project Details — edit form */}
        {canEdit ? (
          <ProjectSettingsForm projectId={projectId} organizationId={organizationId} />
        ) : (
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Only project owners, admins, and project managers can edit project settings.
            </Typography>
          </Box>
        )}

        {/* Danger Zone — delete */}
        {canDelete && (
          <>
            <Box sx={{
              px: 3, py: 1.5,
              bgcolor: alpha(theme.palette.error.main, 0.04),
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.15),
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <Warning size={14} color={theme.palette.error.main} />
              <Typography sx={{
                fontSize: '0.75rem', fontWeight: 600, color: 'error.main',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Danger Zone
              </Typography>
            </Box>
            <Box sx={{
              px: 3, py: 2.5, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 2,
            }}>
              <Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                  Delete this project
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.5 }}>
                  Permanently delete this project and all its data. This cannot be undone.
                </Typography>
              </Box>
              <Button variant="outlined" color="error"
                onClick={() => setDeleteDialogOpen(true)}
                startIcon={<Trash size={14} />}
                sx={{
                  flexShrink: 0, borderRadius: '8px', fontWeight: 600,
                  fontSize: '0.8125rem', textTransform: 'none',
                }}>
                Delete
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Delete Project Dialog */}
      <DeleteProjectDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}
        project={projectId ? { id: projectId, name: projectName } : null} />
    </Box>
  );
}
