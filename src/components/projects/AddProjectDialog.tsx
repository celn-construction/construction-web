'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ArrowRight, MapPin } from 'lucide-react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import Script from 'next/script';
import {
  Autocomplete as MuiAutocomplete,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { useSnackbar } from '@/hooks/useSnackbar';
import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/lib/validations/project';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';
import { useState, useCallback, useEffect } from 'react';
import { env } from '@/env';

const GOOGLE_PLACES_API_KEY = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  // Update options when suggestions change
  useEffect(() => {
    setOptions(data.map((suggestion) => suggestion.description));
  }, [data]);

  const handleSelect = useCallback(
    async (_event: React.SyntheticEvent, newValue: string | null) => {
      if (newValue) {
        onChange(newValue);
        clearSuggestions();
        // Validate the address exists
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

export default function AddProjectDialog({
  open,
  onOpenChange,
}: AddProjectDialogProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const { orgSlug, activeOrganizationId } = useOrgFromUrl();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      location: '',
      template: 'BLANK',
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: (newProject) => {
      showSnackbar('Project created successfully', 'success');
      void utils.project.list.invalidate();
      void utils.project.getActive.invalidate();
      reset();
      onOpenChange(false);
      router.push(`/${orgSlug}/projects/${newProject.slug}/gantt`);
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to create project', 'error');
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    createProject.mutate({
      ...data,
      location: data.location,
      organizationId: activeOrganizationId,
    });
  };

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
      <Dialog
        open={open}
        onClose={() => onOpenChange(false)}
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

        <Box sx={{ p: 3.5, pb: 0 }}>
          {/* Icon + Title block */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2
                size={22}
                style={{ color: theme.palette.primary.main }}
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
                New Project
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                  mt: 0.25,
                  lineHeight: 1.4,
                }}
              >
                Set up a new construction project
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3.5, pt: 2.5, pb: 1 }}>
          <form onSubmit={handleSubmit(onSubmit)} id="add-project-form">
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
        </DialogContent>

        <DialogActions
          sx={{
            px: 3.5,
            py: 2.5,
            gap: 1,
          }}
        >
          <Button
            variant="text"
            onClick={() => onOpenChange(false)}
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
          <Button
            type="submit"
            form="add-project-form"
            variant="contained"
            loading={createProject.isPending}
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
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
              },
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
