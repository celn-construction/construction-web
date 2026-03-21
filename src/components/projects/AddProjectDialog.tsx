'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ArrowRight } from 'lucide-react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import {
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

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProjectDialog({
  open,
  onOpenChange,
}: AddProjectDialogProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();

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
      organizationId: activeOrganizationId,
    });
  };

  return (
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
                    borderRadius: '10px',
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
  );
}
