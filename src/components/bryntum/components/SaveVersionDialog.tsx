'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { saveVersionSchema, type SaveVersionInput } from '@/lib/validations/schedule';

interface SaveVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export default function SaveVersionDialog({ open, onOpenChange, projectId }: SaveVersionDialogProps) {
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();
  const [isSyncing, setIsSyncing] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SaveVersionInput>({
    resolver: zodResolver(saveVersionSchema),
    defaultValues: { name: '' },
  });

  const saveMutation = api.schedule.saveVersion.useMutation({
    onSuccess: (data) => {
      void utils.schedule.listVersions.invalidate({ projectId });
      // Reset the frontend change tracker
      window.dispatchEvent(new CustomEvent('gantt-version-saved', { detail: { name: data.name } }));
      showSnackbar('Version saved', 'success');
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to save version', 'error');
    },
  });

  const handleSave = useCallback((data: SaveVersionInput) => {
    setIsSyncing(true);

    const SYNC_TIMEOUT_MS = 5000;
    let timeoutId: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      window.removeEventListener('gantt-sync-done', onSyncDone);
      clearTimeout(timeoutId);
    };

    const onSyncDone = () => {
      cleanup();
      setIsSyncing(false);
      saveMutation.mutate({ ...data, projectId });
    };

    timeoutId = setTimeout(() => {
      cleanup();
      setIsSyncing(false);
      // Proceed with save even if sync event was not received
      saveMutation.mutate({ ...data, projectId });
    }, SYNC_TIMEOUT_MS);

    window.addEventListener('gantt-sync-done', onSyncDone);
    window.dispatchEvent(new Event('gantt-force-sync'));
  }, [saveMutation, projectId]);

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit(handleSave)}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600, pb: 1 }}>Save Version</DialogTitle>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Version name"
                placeholder="e.g. Baseline v1 — March 31"
                fullWidth
                autoFocus
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={{ mt: 1 }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" size="small" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" size="small" type="submit" loading={isSyncing || saveMutation.isPending}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
