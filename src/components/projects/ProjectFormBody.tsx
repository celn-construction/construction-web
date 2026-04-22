'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CaretDown, MapPin, Image as ImageIcon, Swatches, UploadSimple, X } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
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
import { useSnackbar } from '@/hooks/useSnackbar';
import { useLoading } from '@/components/providers/LoadingProvider';
import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/lib/validations/project';
import {
  PROJECT_ICON_OPTIONS,
  getProjectIcon,
} from '@/lib/constants/projectIconComponents';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { env } from '@/env';

const GOOGLE_PLACES_API_KEY = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

interface ProjectFormBodyProps {
  orgSlug: string;
  organizationId: string;
  title: string;
  subtitle: string;
  onCancel?: () => void;
  onSuccess?: () => void;
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
  const theme = useTheme();
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
          // Address selected from autocomplete, keep it even if geocode fails
        }
      } else {
        onChange('');
      }
    },
    [onChange, clearSuggestions]
  );

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      fontSize: '0.9375rem',
      bgcolor: alpha(theme.palette.divider, 0.08),
      transition: 'all 0.15s ease',
      '& fieldset': {
        borderColor: 'transparent',
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.3),
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: '1.5px',
      },
      '&.Mui-focused': {
        bgcolor: 'background.paper',
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
      },
    },
    '& .MuiOutlinedInput-input': {
      py: 1.5,
      px: 1.75,
      '&::placeholder': {
        color: alpha(theme.palette.text.secondary, 0.5),
        opacity: 1,
      },
    },
  };

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
          placeholder="e.g. 123 Main St, New York, NY"
          error={error}
          helperText={helperText}
          fullWidth
          sx={fieldSx}
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
  const theme = useTheme();

  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="e.g. 123 Main St, New York, NY"
      error={error}
      helperText={helperText}
      fullWidth
      autoComplete="off"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          fontSize: '0.9375rem',
          bgcolor: alpha(theme.palette.divider, 0.08),
          transition: 'all 0.15s ease',
          '& fieldset': {
            borderColor: 'transparent',
          },
          '&:hover fieldset': {
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: '1.5px',
          },
          '&.Mui-focused': {
            bgcolor: 'background.paper',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
          },
        },
        '& .MuiOutlinedInput-input': {
          py: 1.5,
          px: 1.75,
          '&::placeholder': {
            color: alpha(theme.palette.text.secondary, 0.5),
            opacity: 1,
          },
        },
      }}
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
  const [iconAnchorEl, setIconAnchorEl] = useState<HTMLElement | null>(null);
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
      template: 'BLANK',
    },
  });

  const selectedIcon = watch('icon') ?? 'building';
  const SelectedIconComponent = getProjectIcon(selectedIcon);
  const selectedIconLabel = PROJECT_ICON_OPTIONS.find(o => o.id === selectedIcon)?.label ?? 'Building';
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
      uploadedUrlRef.current = null; // Don't clean up — project owns it now
      handleReset();

      if (onSuccess) {
        // Modal mode — show toast, let user switch manually via project dropdown
        hideLoading();
        showSnackbar(`"${newProject.name}" created — switch to it in the project dropdown`, 'success');
        onSuccess();
      } else {
        // Standalone mode — navigate to the new project
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
      // Standalone mode — close and show loading overlay
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

      // Clean up previous upload if replacing
      if (uploadedUrlRef.current) {
        cleanupUploadedImage(uploadedUrlRef.current);
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localPreview;
      });

      uploadedUrlRef.current = data.imageUrl;
      setValue('imageUrl', data.imageUrl);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        setUploadError('File size exceeds 5MB limit');
      } else if (error?.code === 'file-invalid-type') {
        setUploadError('Only image files are allowed');
      } else {
        setUploadError('File not accepted');
      }
    },
  });

  const handleSwitchToIcon = useCallback(() => {
    setPickerMode('icon');
    setUploadError(null);
    if (uploadedUrlRef.current) {
      cleanupUploadedImage();
      setValue('imageUrl', undefined);
    }
  }, [setValue, cleanupUploadedImage]);

  const handleSwitchToPhoto = useCallback(() => {
    setPickerMode('photo');
    setUploadError(null);
  }, []);

  const useGooglePlaces = !!GOOGLE_PLACES_API_KEY && scriptLoaded;

  return (
    <>
      {GOOGLE_PLACES_API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`}
          strategy="lazyOnload"
          onReady={() => setScriptLoaded(true)}
        />
      )}

      {/* Header: Icon + Title */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            bgcolor: displayImageUrl ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
            border: displayImageUrl ? 'none' : `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            overflow: 'hidden',
          }}
        >
          <ProjectAvatar
            imageUrl={displayImageUrl}
            icon={selectedIcon}
            size={displayImageUrl ? 44 : 22}
            borderRadius="12px"
            color={theme.palette.primary.main}
          />
        </Box>
        <Box sx={{ pt: 0.25 }}>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
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
        </Box>
      </Box>

      {/* Form */}
      <Box sx={{ pt: 1 }}>
        <form onSubmit={handleSubmit(onSubmit)} id="project-form">
          {/* Picker Mode Toggle */}
          <Box
            role="radiogroup"
            aria-label="Project image type"
            sx={{
              display: 'inline-flex',
              borderRadius: '8px',
              bgcolor: alpha(theme.palette.divider, 0.08),
              p: '3px',
              mb: 1.5,
            }}
          >
            <Box
              component="button"
              type="button"
              role="radio"
              aria-checked={pickerMode === 'icon'}
              onClick={handleSwitchToIcon}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.625,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
                transition: 'all 0.15s ease',
                bgcolor: pickerMode === 'icon' ? 'background.paper' : 'transparent',
                color: pickerMode === 'icon' ? theme.palette.primary.main : theme.palette.text.secondary,
                boxShadow: pickerMode === 'icon' ? `0 1px 3px ${alpha('#000', 0.08)}` : 'none',
                '&:hover': {
                  color: pickerMode === 'icon' ? theme.palette.primary.main : theme.palette.text.primary,
                },
              }}
            >
              <Swatches size={14} weight={pickerMode === 'icon' ? 'fill' : 'regular'} />
              Icon
            </Box>
            <Box
              component="button"
              type="button"
              role="radio"
              aria-checked={pickerMode === 'photo'}
              onClick={handleSwitchToPhoto}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.625,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
                transition: 'all 0.15s ease',
                bgcolor: pickerMode === 'photo' ? 'background.paper' : 'transparent',
                color: pickerMode === 'photo' ? theme.palette.primary.main : theme.palette.text.secondary,
                boxShadow: pickerMode === 'photo' ? `0 1px 3px ${alpha('#000', 0.08)}` : 'none',
                '&:hover': {
                  color: pickerMode === 'photo' ? theme.palette.primary.main : theme.palette.text.primary,
                },
              }}
            >
              <ImageIcon size={14} weight={pickerMode === 'photo' ? 'fill' : 'regular'} />
              Photo
            </Box>
          </Box>

          {/* Icon Picker (dropdown) */}
          {pickerMode === 'icon' && (
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <>
                  <Box
                    component="button"
                    type="button"
                    onClick={(e: React.MouseEvent<HTMLElement>) => setIconAnchorEl(e.currentTarget)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      mb: 2.5,
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: alpha(theme.palette.divider, 0.3),
                      bgcolor: alpha(theme.palette.divider, 0.06),
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'text.primary',
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
                    open={!!iconAnchorEl}
                    anchorEl={iconAnchorEl}
                    onClose={() => setIconAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    slotProps={{
                      paper: {
                        sx: {
                          borderRadius: '10px',
                          mt: 0.5,
                          p: 1,
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
                            <Box
                              component="button"
                              type="button"
                              onClick={() => { field.onChange(id); setIconAnchorEl(null); }}
                              sx={{
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                border: '1.5px solid',
                                borderColor: isSelected ? theme.palette.primary.main : 'transparent',
                                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                p: 0,
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
              )}
            />
          )}

          {/* Photo Picker */}
          {pickerMode === 'photo' && (
            <Box sx={{ mb: 2.5 }}>
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
                  {...getRootProps()}
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
                      : isDragActive
                        ? theme.palette.primary.main
                        : alpha(theme.palette.divider, 0.4),
                    borderRadius: '10px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    bgcolor: isDragActive
                      ? alpha(theme.palette.primary.main, 0.04)
                      : 'transparent',
                    opacity: isUploading ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isUploading
                        ? alpha(theme.palette.divider, 0.4)
                        : alpha(theme.palette.primary.main, 0.4),
                      bgcolor: isUploading
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <UploadSimple
                      size={20}
                      style={{ color: theme.palette.text.disabled }}
                    />
                  )}
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      color: 'text.secondary',
                    }}
                  >
                    {isUploading
                      ? 'Uploading...'
                      : isDragActive
                        ? 'Drop image here'
                        : 'Drag & drop or click to upload'}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      color: 'text.secondary',
                    }}
                  >
                    PNG, JPG, WebP up to 5MB
                  </Typography>
                </Box>
              )}
              {uploadError && (
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: 'error.main',
                    mt: 0.75,
                  }}
                >
                  {uploadError}
                </Typography>
              )}
            </Box>
          )}

          {/* Project Name */}
          <Typography
            component="label"
            htmlFor="project-name-input"
            sx={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 0.75,
            }}
          >
            Project Name
          </Typography>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="project-name-input"
                placeholder="e.g. Downtown Tower Construction"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
                autoFocus
                autoComplete="off"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    bgcolor: alpha(theme.palette.divider, 0.08),
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'background.paper',
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    py: 1.5,
                    px: 1.75,
                    '&::placeholder': {
                      color: alpha(theme.palette.text.secondary, 0.5),
                      opacity: 1,
                    },
                  },
                }}
              />
            )}
          />

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 2.5, mb: 0.75 }}>
            <MapPin size={13} style={{ color: theme.palette.text.secondary }} />
            <Typography
              component="label"
              sx={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Location
            </Typography>
          </Box>
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
        </form>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          pt: 2.5,
        }}
      >
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
              '&:hover': {
                bgcolor: alpha(theme.palette.divider, 0.12),
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
            boxShadow: `0 1px 3px ${alpha(theme.palette.primary.main, 0.3)}`,
            ...(!onCancel && {
              width: '100%',
              py: 1.5,
              fontSize: '0.9375rem',
            }),
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
            },
          }}
        >
          Create Project
        </Button>
      </Box>
    </>
  );
}
