'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Image as ImageIcon,
  Swatches,
  UploadSimple,
  X,
  Plus,
} from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { keyframes } from '@mui/system';
import {
  Autocomplete as MuiAutocomplete,
  Box,
  CircularProgress,
  IconButton,
  Popover,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import ProjectAvatar from '@/components/ui/ProjectAvatar';
import SidebarRowPreview from '@/components/projects/SidebarRowPreview';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useLoading } from '@/components/providers/LoadingProvider';
import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/lib/validations/project';
import { PROJECT_ICON_OPTIONS } from '@/lib/constants/projectIconComponents';
import {
  PROJECT_COLOR_OPTIONS,
  type ProjectColor,
} from '@/lib/constants/projectColors';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { env } from '@/env';

const GOOGLE_PLACES_API_KEY = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

const overlayEnter = keyframes`
  from { opacity: 0; transform: scale(0.985); }
  to   { opacity: 1; transform: scale(1); }
`;

interface ProjectFormBodyProps {
  orgSlug: string;
  organizationId: string;
  title: string;
  subtitle: string;
  onCancel?: () => void;
  onSuccess?: (project: { id: string; slug: string; name: string }) => void;
  replaceOnNavigate?: boolean;
}

function LocationAutocompleteField({
  value,
  onChange,
  error,
  helperText,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
}) {
  const {
    ready,
    suggestions: { data },
    setValue: setSearchValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['address'],
    },
    debounce: 300,
  });

  const [options, setOptions] = useState<string[]>([]);

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setSearchValue(newInputValue);
      onChange(newInputValue);
    },
    [setSearchValue, onChange]
  );

  useEffect(() => {
    setOptions(data.map((suggestion) => suggestion.description));
  }, [data]);

  const handleSelect = useCallback(
    async (_event: React.SyntheticEvent, newValue: string | null) => {
      if (newValue) {
        onChange(newValue);
        clearSuggestions();
        try {
          await getGeocode({ address: newValue });
        } catch {
          // address selected from autocomplete; keep it even if geocode fails
        }
      } else {
        onChange('');
      }
    },
    [onChange, clearSuggestions]
  );

  return (
    <MuiAutocomplete
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={handleInputChange}
      onChange={handleSelect}
      disabled={!ready}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Location"
          placeholder="123 Main St, New York, NY"
          error={error}
          helperText={helperText}
          fullWidth
        />
      )}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '8px',
            mt: 0.5,
            boxShadow: `0 8px 24px ${alpha('#000', 0.12)}`,
            '& .MuiAutocomplete-option': {
              fontSize: '0.875rem',
              py: 1,
              px: 1.75,
            },
          },
        },
      }}
    />
  );
}

function PlainLocationField({
  value,
  onChange,
  error,
  helperText,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
}) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      label="Location"
      placeholder="123 Main St, New York, NY"
      error={error}
      helperText={helperText}
      fullWidth
      autoComplete="off"
    />
  );
}

export default function ProjectFormBody({
  orgSlug,
  organizationId,
  title,
  subtitle,
  onCancel,
  onSuccess,
  replaceOnNavigate,
}: ProjectFormBodyProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const { showLoading, hideLoading } = useLoading();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [pickerMode, setPickerMode] = useState<'icon' | 'photo'>('icon');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [identityAnchor, setIdentityAnchor] = useState<HTMLElement | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      location: '',
      icon: 'building',
      color: 'slate',
      template: 'BLANK',
    },
  });

  const selectedIcon = watch('icon') ?? 'building';
  const selectedColor = (watch('color') ?? 'slate') as ProjectColor;
  const imageUrl = watch('imageUrl');
  const displayImageUrl = previewUrl ?? imageUrl;

  const cleanupUploadedImage = useCallback((url?: string) => {
    const urlToDelete = url ?? uploadedUrlRef.current;
    if (urlToDelete && organizationId) {
      void fetch('/api/project/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlToDelete, organizationId }),
      }).catch(() => { /* silent cleanup */ });
      uploadedUrlRef.current = null;
    }
  }, [organizationId]);

  // Clean up orphaned image on unmount
  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) {
        const urlToDelete = uploadedUrlRef.current;
        if (urlToDelete && organizationId) {
          void fetch('/api/project/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: urlToDelete, organizationId }),
          }).catch(() => { /* silent cleanup */ });
        }
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setPickerMode('icon');
    setUploadError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [reset]);

  const createProject = api.project.create.useMutation({
    onSuccess: (newProject) => {
      void utils.project.list.invalidate();
      void utils.project.getActive.invalidate();
      uploadedUrlRef.current = null; // project owns the image now
      handleReset();

      if (onSuccess) {
        hideLoading();
        onSuccess({
          id: newProject.id,
          slug: newProject.slug,
          name: newProject.name,
        });
      } else {
        showSnackbar('Project created successfully', 'success');
        if (replaceOnNavigate) {
          router.replace(`/${orgSlug}/projects/${newProject.slug}/gantt`);
        } else {
          router.push(`/${orgSlug}/projects/${newProject.slug}/gantt`);
        }
      }
    },
    onError: (error) => {
      hideLoading();
      showSnackbar(error.message || 'Failed to create project', 'error');
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    if (!onSuccess) {
      onCancel?.();
      showLoading('Creating your project...');
    }
    createProject.mutate({
      ...data,
      location: data.location,
      organizationId,
    });
  };

  const handleCancel = useCallback(() => {
    if (uploadedUrlRef.current) {
      cleanupUploadedImage();
    }
    handleReset();
    onCancel?.();
  }, [cleanupUploadedImage, handleReset, onCancel]);

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

      const res = await fetch('/api/project/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        URL.revokeObjectURL(localPreview);
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Upload failed');
      }

      const data = await res.json() as { imageUrl: string };

      if (uploadedUrlRef.current) {
        cleanupUploadedImage(uploadedUrlRef.current);
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localPreview;
      });

      uploadedUrlRef.current = data.imageUrl;
      setValue('imageUrl', data.imageUrl);
      setPickerMode('photo');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed — try again');
    } finally {
      setIsUploading(false);
    }
  }, [organizationId, setValue, cleanupUploadedImage]);

  const handleRemovePhoto = useCallback(() => {
    if (uploadedUrlRef.current) {
      cleanupUploadedImage();
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setValue('imageUrl', undefined);
    setUploadError(null);
  }, [setValue, cleanupUploadedImage]);

  const handleDropRejected = useCallback((rejections: import('react-dropzone').FileRejection[]) => {
    const error = rejections[0]?.errors[0];
    if (error?.code === 'file-too-large') {
      setUploadError('File size exceeds 5MB limit');
    } else if (error?.code === 'file-invalid-type') {
      setUploadError('Only image files are allowed');
    } else {
      setUploadError('File not accepted');
    }
  }, []);

  // ── Whole-modal dropzone: drop anywhere on the form to upload as cover. ─
  const rootDropzone = useDropzone({
    onDrop: handlePhotoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
    noClick: true,
    noKeyboard: true,
    onDropRejected: handleDropRejected,
  });

  // Click-to-upload zone inside the popover (separate dropzone instance with click enabled).
  const popoverDropzone = useDropzone({
    onDrop: handlePhotoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
    onDropRejected: handleDropRejected,
  });

  const useGooglePlaces = !!GOOGLE_PLACES_API_KEY && scriptLoaded;
  const closePopover = () => setIdentityAnchor(null);

  return (
    <>
      {GOOGLE_PLACES_API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`}
          strategy="lazyOnload"
          onReady={() => setScriptLoaded(true)}
        />
      )}

      {/* Whole-modal dropzone wrapper. Drop anywhere → uploads + switches to photo. */}
      <Box {...rootDropzone.getRootProps()} sx={{ position: 'relative', outline: 'none' }}>
        <input {...rootDropzone.getInputProps()} />

        {/* Drag overlay */}
        {rootDropzone.isDragActive && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              border: `2px dashed ${theme.palette.primary.main}`,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.875rem',
              pointerEvents: 'none',
              zIndex: 5,
              backdropFilter: 'blur(2px)',
              animation: `${overlayEnter} 0.18s ease`,
            }}
          >
            Drop image to use as cover
          </Box>
        )}

        {/* Identity row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2.5 }}>
          <Box
            component="button"
            type="button"
            aria-label="Change project icon, color, or photo"
            onClick={(e: React.MouseEvent<HTMLElement>) => setIdentityAnchor(e.currentTarget)}
            sx={{
              position: 'relative',
              width: 56,
              height: 56,
              borderRadius: '14px',
              border: 0,
              p: 0,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: 'transparent',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 10px ${alpha('#000', 0.08)}`,
              },
              '&:hover .identity-badge': {
                transform: 'scale(1.2)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
            }}
          >
            <ProjectAvatar
              imageUrl={displayImageUrl}
              icon={selectedIcon}
              colorId={displayImageUrl ? null : selectedColor}
              size={56}
              borderRadius="14px"
            />
            {/* + edit badge */}
            <Box
              aria-hidden
              className="identity-badge"
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 22,
                height: 22,
                borderRadius: '999px',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                boxShadow: `0 1px 2px ${alpha('#000', 0.06)}`,
                transition: 'transform 0.15s ease',
              }}
            >
              <Plus size={11} weight="bold" />
            </Box>
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: 'text.primary',
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: 'text.secondary',
                mt: 0.25,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>

            {/* Color swatches — hidden when displaying a photo */}
            {!displayImageUrl && (
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Box
                    role="radiogroup"
                    aria-label="Project color"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.875 }}
                  >
                    {PROJECT_COLOR_OPTIONS.map((c) => {
                      const isSelected = (field.value ?? 'slate') === c.id;
                      return (
                        <Tooltip key={c.id} title={c.label} arrow placement="top">
                          <Box
                            component="button"
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={c.label}
                            onClick={() => field.onChange(c.id)}
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '999px',
                              bgcolor: c.swatch,
                              cursor: 'pointer',
                              border: 0,
                              p: 0,
                              boxShadow: isSelected
                                ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 3.5px ${theme.palette.text.primary}`
                                : `inset 0 0 0 1px ${alpha('#000', 0.08)}`,
                              transition: 'transform 0.12s ease, box-shadow 0.18s ease',
                              '&:hover': { transform: 'scale(1.15)' },
                              '&:active': { transform: 'scale(0.85)' },
                              '&:focus-visible': {
                                outline: `2px solid ${theme.palette.primary.main}`,
                                outlineOffset: 2,
                              },
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              />
            )}
          </Box>
        </Box>

        {/* Identity popover (Icon/Photo tabs) */}
        <Popover
          open={!!identityAnchor}
          anchorEl={identityAnchor}
          onClose={closePopover}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: '12px',
                mt: 1,
                p: 1.25,
                width: 320,
                boxShadow: `0 12px 32px ${alpha('#000', 0.14)}`,
              },
            },
          }}
        >
          {/* Tab header */}
          <Box
            role="tablist"
            sx={{
              display: 'flex',
              gap: 0.5,
              bgcolor: alpha(theme.palette.divider, 0.12),
              p: '3px',
              borderRadius: '8px',
              mb: 1.25,
            }}
          >
            <Box
              component="button"
              type="button"
              role="tab"
              aria-selected={pickerMode === 'icon'}
              onClick={() => setPickerMode('icon')}
              sx={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                py: 0.625,
                borderRadius: '6px',
                border: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: pickerMode === 'icon' ? 'background.paper' : 'transparent',
                color: pickerMode === 'icon' ? 'primary.main' : 'text.secondary',
                boxShadow: pickerMode === 'icon' ? `0 1px 3px ${alpha('#000', 0.08)}` : 'none',
              }}
            >
              <Swatches size={13} weight={pickerMode === 'icon' ? 'fill' : 'regular'} />
              Icon
            </Box>
            <Box
              component="button"
              type="button"
              role="tab"
              aria-selected={pickerMode === 'photo'}
              onClick={() => setPickerMode('photo')}
              sx={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                py: 0.625,
                borderRadius: '6px',
                border: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: pickerMode === 'photo' ? 'background.paper' : 'transparent',
                color: pickerMode === 'photo' ? 'primary.main' : 'text.secondary',
                boxShadow: pickerMode === 'photo' ? `0 1px 3px ${alpha('#000', 0.08)}` : 'none',
              }}
            >
              <ImageIcon size={13} weight={pickerMode === 'photo' ? 'fill' : 'regular'} />
              Photo
            </Box>
          </Box>

          {/* Icon tab body */}
          {pickerMode === 'icon' && (
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                  {PROJECT_ICON_OPTIONS.map(({ id, label, Icon }) => {
                    const isSelected = (field.value ?? 'building') === id;
                    return (
                      <Tooltip key={id} title={label} arrow placement="top">
                        <Box
                          component="button"
                          type="button"
                          onClick={() => field.onChange(id)}
                          sx={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            border: '1.5px solid',
                            borderColor: isSelected ? theme.palette.primary.main : 'transparent',
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.08)
                              : 'transparent',
                            color: isSelected
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            p: 0,
                            '&:hover': {
                              bgcolor: isSelected
                                ? alpha(theme.palette.primary.main, 0.12)
                                : alpha(theme.palette.divider, 0.18),
                              color: isSelected
                                ? theme.palette.primary.main
                                : theme.palette.text.primary,
                            },
                            '&:active': { transform: 'scale(0.88)' },
                          }}
                        >
                          <Icon size={18} weight={isSelected ? 'fill' : 'regular'} />
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}
            />
          )}

          {/* Photo tab body */}
          {pickerMode === 'photo' && (
            <Box>
              {displayImageUrl ? (
                <Box
                  sx={{
                    position: 'relative',
                    '&:hover .remove-photo-btn': { opacity: 1 },
                  }}
                >
                  <Box
                    component="img"
                    src={displayImageUrl}
                    alt="Project cover"
                    sx={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />
                  <IconButton
                    className="remove-photo-btn"
                    onClick={handleRemovePhoto}
                    aria-label="Remove uploaded photo"
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      bgcolor: alpha('#000', 0.5),
                      '&:hover': { bgcolor: alpha('#000', 0.7) },
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      color: 'white',
                      p: 0.5,
                    }}
                  >
                    <X size={14} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  {...popoverDropzone.getRootProps()}
                  aria-label="Upload project photo"
                  aria-busy={isUploading}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    py: 2.5,
                    border: '1.5px dashed',
                    borderColor: uploadError
                      ? theme.palette.error.main
                      : popoverDropzone.isDragActive
                        ? theme.palette.primary.main
                        : alpha(theme.palette.divider, 0.5),
                    borderRadius: '10px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    bgcolor: popoverDropzone.isDragActive
                      ? alpha(theme.palette.primary.main, 0.04)
                      : 'transparent',
                    opacity: isUploading ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isUploading
                        ? alpha(theme.palette.divider, 0.5)
                        : alpha(theme.palette.primary.main, 0.4),
                      bgcolor: isUploading
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <input {...popoverDropzone.getInputProps()} />
                  {isUploading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <UploadSimple size={20} style={{ color: theme.palette.text.disabled }} />
                  )}
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                    {isUploading
                      ? 'Uploading...'
                      : popoverDropzone.isDragActive
                        ? 'Drop image here'
                        : 'Click to upload or drop here'}
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
        </Popover>

        {/* Form fields */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} id="project-form">
          {/* Name */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="project-name-input"
                label="Name"
                placeholder="Downtown Tower Construction"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
                autoFocus
                autoComplete="off"
              />
            )}
          />

          {/* Location */}
          <Box sx={{ mt: 2 }}>
          <Controller
            name="location"
            control={control}
            render={({ field }) =>
              useGooglePlaces ? (
                <LocationAutocompleteField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={!!errors.location}
                  helperText={errors.location?.message}
                />
              ) : (
                <PlainLocationField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={!!errors.location}
                  helperText={errors.location?.message}
                />
              )
            }
          />
          </Box>
        </Box>

        {/* Live sidebar preview — how the project appears in the nav */}
        <SidebarRowPreview
          name={watch('name')}
          icon={selectedIcon}
          colorId={selectedColor}
          imageUrl={displayImageUrl ?? undefined}
          location={watch('location') ?? undefined}
          organizationId={organizationId}
        />

        {/* Actions row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mt: 2.25,
            pt: 1.75,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: 'text.secondary',
              display: { xs: 'none', sm: 'block' },
              opacity: 0.85,
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            Drop an image anywhere to use as cover
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexShrink: 0 }}>
            {onCancel && (
              <Button
                variant="text"
                onClick={handleCancel}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  px: 2,
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.divider, 0.18),
                    color: 'text.primary',
                  },
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              form="project-form"
              variant="contained"
              loading={createProject.isPending}
              disabled={isUploading}
              onClick={handleSubmit(onSubmit)}
              endIcon={<ArrowRight size={16} />}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                px: 2.5,
                py: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.25)}`,
                ...(!onCancel && {
                  width: '100%',
                  py: 1.5,
                  fontSize: '0.9375rem',
                }),
                '& .MuiButton-endIcon': {
                  transition: 'transform 0.15s ease',
                },
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '& .MuiButton-endIcon': { transform: 'translateX(3px)' },
                },
              }}
            >
              Create project
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
