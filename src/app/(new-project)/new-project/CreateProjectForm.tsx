'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ArrowRight } from 'lucide-react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/lib/validations/project';

interface CreateProjectFormProps {
  orgSlug: string;
  orgName: string;
  organizationId: string;
}

export default function CreateProjectForm({
  orgSlug,
  orgName,
  organizationId,
}: CreateProjectFormProps) {
  const router = useRouter();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      template: 'BLANK',
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: (newProject) => {
      router.replace(`/${orgSlug}/projects/${newProject.slug}/gantt`);
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    createProject.mutate({
      ...data,
      organizationId,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        p: 5,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Icon + Title */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
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
            size={24}
            style={{ color: theme.palette.primary.main }}
          />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            Create Your First Project
          </Typography>
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              mt: 0.5,
              lineHeight: 1.5,
            }}
          >
            Set up a project for {orgName} to start tracking tasks and timelines.
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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

        {createProject.error && (
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: 'error.main',
              mt: 1.5,
            }}
          >
            {createProject.error.message || 'Failed to create project'}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={createProject.isPending}
          endIcon={
            createProject.isPending ? (
              <CircularProgress size={16} sx={{ color: 'inherit' }} />
            ) : (
              <ArrowRight size={18} />
            )
          }
          sx={{
            mt: 3,
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9375rem',
            py: 1.5,
            textTransform: 'none',
            boxShadow: `0 1px 3px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
            },
          }}
        >
          Create Project
        </Button>
      </Box>
    </Paper>
  );
}
