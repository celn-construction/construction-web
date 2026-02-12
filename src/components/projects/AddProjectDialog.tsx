'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { api } from '~/trpc/react';
import { useSwitchProject } from '@/store/hooks';
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
import {
  createProjectSchema,
  type CreateProjectInput,
} from '~/lib/validations/project';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProjectDialog({
  open,
  onOpenChange,
}: AddProjectDialogProps) {
  const utils = api.useUtils();
  const switchProject = useSwitchProject();
  const { showSnackbar } = useSnackbar();

  // Initialize form with react-hook-form + zod
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: (newProject) => {
      showSnackbar('Project created successfully', 'success');
      void utils.project.list.invalidate();
      switchProject(newProject.id);
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to create project', 'error');
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    createProject.mutate(data);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              opacity: 0.1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Plus
              size={20}
              style={{
                color: 'var(--accent-primary)',
                position: 'absolute',
                zIndex: 1,
              }}
            />
          </Box>
          <DialogTitle sx={{ p: 0 }}>Add Project</DialogTitle>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a new project for your organization
        </Typography>

        <DialogContent sx={{ p: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Name"
                    placeholder="Downtown Tower Construction"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                )}
              />
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
            disabled={createProject.isPending}
            startIcon={createProject.isPending ? <CircularProgress size={16} /> : null}
          >
            Create Project
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
