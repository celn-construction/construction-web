'use client';

import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Tooltip,
} from '@mui/material';
import { X, DotsThreeVertical, ClockCounterClockwise, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';
import { useGanttChangesStore } from '@/store/ganttChangesStore';

/** Format a date for display as a version label */
function formatVersionDate(date: Date): string {
  return format(date, 'MMM d, yyyy · h:mm a');
}

/** Get the display label for a version (name or formatted date) */
function getVersionLabel(version: { name: string | null; createdAt: Date | string }): string {
  if (version.name) return version.name;
  return formatVersionDate(new Date(version.createdAt));
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  memberRole: Role;
  onRestore?: () => void;
}

export default function VersionHistoryDrawer({
  open,
  onOpenChange,
  projectId,
  memberRole,
  onRestore,
}: VersionHistoryDrawerProps) {
  const utils = api.useUtils();
  const { showSnackbar } = useSnackbar();
  const canManage = hasPermission(memberRole, 'MANAGE_PROJECTS');
  const { activeVersionId } = useGanttChangesStore();

  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; versionId: string; versionLabel: string } | null>(null);

  const { data: versions = [], isLoading } = api.schedule.listVersions.useQuery(
    { projectId },
    { enabled: open },
  );

  const deleteMutation = api.schedule.deleteVersion.useMutation({
    onSuccess: () => {
      void utils.schedule.listVersions.invalidate({ projectId });
      showSnackbar('Version deleted', 'success');
      setConfirmAction(null);
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to delete version', 'error');
    },
  });

  const restoreMutation = api.schedule.restoreVersion.useMutation({
    onSuccess: () => {
      void utils.schedule.listVersions.invalidate({ projectId });
      showSnackbar('Version restored', 'success');
      const restoredLabel = confirmAction?.versionLabel ?? '';
      const restoredId = confirmAction?.versionId ?? '';
      setConfirmAction(null);
      onOpenChange(false);
      // Trigger Gantt reload and notify store of restored version
      window.dispatchEvent(new CustomEvent('gantt-version-restored', { detail: { name: restoredLabel, id: restoredId } }));
      window.dispatchEvent(new Event('gantt-reload'));
      onRestore?.();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to restore version', 'error');
    },
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') {
      deleteMutation.mutate({ projectId, versionId: confirmAction.versionId });
    } else {
      restoreMutation.mutate({ projectId, versionId: confirmAction.versionId });
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => onOpenChange(false)}
        PaperProps={{
          sx: { width: 360, maxWidth: '100vw' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Version History</Typography>
            <Tooltip title={`${versions.length} of 50 saved versions used`} arrow placement="bottom">
              <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500, cursor: 'default' }}>
                {versions.length}/50
              </Typography>
            </Tooltip>
          </Box>
          <IconButton size="small" onClick={() => onOpenChange(false)} sx={{ p: 0.5 }}>
            <X size={16} />
          </IconButton>
        </Box>
        {versions.length >= 45 && (
          <Box sx={{ mx: 2.5, mb: 1, px: 1.5, py: 1, borderRadius: '8px', bgcolor: versions.length >= 50 ? 'error.main' : 'warning.main', opacity: 0.9 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'white', lineHeight: 1.3 }}>
              {versions.length >= 50
                ? 'Version limit reached. Delete older versions to save new ones.'
                : `${50 - versions.length} versions remaining. Consider deleting older versions.`}
            </Typography>
          </Box>
        )}
        <Divider />

        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 1.5 }}>
          {isLoading ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', py: 4 }}>
              Loading...
            </Typography>
          ) : versions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                No versions saved yet
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>
                Save a version to create a snapshot of your schedule
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {versions.map((version, index) => {
                const label = getVersionLabel(version);
                // Active = explicitly tracked version, or latest (first) by default
                const isActive = activeVersionId ? version.id === activeVersionId : index === 0;
                return (
                  <Box
                    key={version.id}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: '8px',
                      bgcolor: isActive ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: isActive ? 'action.selected' : 'action.hover' },
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '2.5px',
                          height: 16,
                          borderRadius: '0 2px 2px 0',
                          bgcolor: 'primary.main',
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          {label}
                        </Typography>
                        {isActive && (
                          <Typography
                            sx={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: 'primary.main',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              lineHeight: 1,
                              flexShrink: 0,
                              px: 0.75,
                              py: 0.25,
                              borderRadius: '4px',
                              bgcolor: 'rgba(43, 45, 66, 0.08)',
                            }}
                          >
                            Current
                          </Typography>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, lineHeight: 1.2 }}>
                        {version.createdBy.name ?? version.createdBy.email} · {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </Typography>
                      {/* Always show the full date & time */}
                      <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.25, lineHeight: 1 }}>
                        {formatVersionDate(new Date(version.createdAt))}
                      </Typography>
                      {version.description && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: 'text.disabled',
                            mt: 0.5,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {version.description}
                        </Typography>
                      )}
                    </Box>

                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <IconButton size="small" sx={{ p: 0.5, flexShrink: 0, mt: 0.25 }}>
                            <DotsThreeVertical size={16} weight="bold" />
                          </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'restore', versionId: version.id, versionLabel: label })}
                          >
                            <ClockCounterClockwise size={14} style={{ marginRight: 8 }} />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'delete', versionId: version.id, versionLabel: label })}
                          >
                            <Trash size={14} style={{ marginRight: 8 }} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
          {confirmAction?.type === 'restore' ? 'Restore Version' : 'Delete Version'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            {confirmAction?.type === 'restore'
              ? `This will replace your current schedule with "${confirmAction.versionLabel}". This cannot be undone.`
              : `Are you sure you want to delete "${confirmAction?.versionLabel}"? This cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setConfirmAction(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            color={confirmAction?.type === 'delete' ? 'error' : 'primary'}
            loading={deleteMutation.isPending || restoreMutation.isPending}
            onClick={handleConfirm}
          >
            {confirmAction?.type === 'restore' ? 'Restore' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
