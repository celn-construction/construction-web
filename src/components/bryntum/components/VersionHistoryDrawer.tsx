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
  Tabs,
  Tab,
} from '@mui/material';
import { X, DotsThreeVertical, ClockCounterClockwise, Trash, GitCommit, Plus, PencilSimple, MinusCircle } from '@phosphor-icons/react';
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
import type { RevisionSummary } from '@/lib/types/schedule';

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

  const [activeTab, setActiveTab] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; versionId: string; versionLabel: string } | null>(null);

  const { data: versions = [], isLoading } = api.schedule.listVersions.useQuery(
    { projectId },
    { enabled: open },
  );

  const { data: revisionsData, isLoading: isLoadingRevisions } = api.schedule.listRevisions.useQuery(
    { projectId },
    { enabled: open && activeTab === 1 },
  );
  const revisions = revisionsData?.revisions ?? [];

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
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, cursor: 'default' }}>
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
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{
            minHeight: 36,
            px: 2.5,
            '& .MuiTab-root': {
              minHeight: 36,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              py: 0,
              px: 1.5,
              minWidth: 0,
            },
          }}
        >
          <Tab label="Versions" />
          <Tab label="Change Log" />
        </Tabs>
        <Divider />

        {/* ── Tab 0: Versions (existing) ── */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 1.5, display: activeTab === 0 ? 'block' : 'none' }}>
          {isLoading ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', py: 4 }}>
              Loading...
            </Typography>
          ) : versions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                No versions saved yet
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
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
                              bgcolor: 'action.selected',
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
                      <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.25, lineHeight: 1 }}>
                        {formatVersionDate(new Date(version.createdAt))}
                      </Typography>
                      {version.description && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: 'text.secondary',
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

        {/* ── Tab 1: Change Log (revisions) ── */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 1.5, display: activeTab === 1 ? 'block' : 'none' }}>
          {isLoadingRevisions ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', py: 4 }}>
              Loading...
            </Typography>
          ) : revisions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                No changes recorded yet
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                Changes are automatically logged when the schedule is synced
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {revisions.map((revision) => {
                const s = revision.summary;
                return (
                  <Box
                    key={revision.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <GitCommit size={14} weight="bold" style={{ flexShrink: 0, marginTop: 2, opacity: 0.4 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Change summary chips */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                        {s && s.tasksAdded > 0 && (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: '0.625rem', fontWeight: 600, color: 'var(--status-green)' }}>
                            <Plus size={9} weight="bold" /> {s.tasksAdded} task{s.tasksAdded !== 1 ? 's' : ''}
                          </Box>
                        )}
                        {s && s.tasksModified > 0 && (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: '0.625rem', fontWeight: 600, color: 'var(--status-amber)' }}>
                            <PencilSimple size={9} weight="bold" /> {s.tasksModified} modified
                          </Box>
                        )}
                        {s && s.tasksRemoved > 0 && (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: '0.625rem', fontWeight: 600, color: 'var(--status-red)' }}>
                            <MinusCircle size={9} weight="bold" /> {s.tasksRemoved} removed
                          </Box>
                        )}
                        {s && (s.dependenciesAdded + s.dependenciesModified + s.dependenciesRemoved) > 0 && (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: '0.625rem', fontWeight: 500, color: 'text.secondary' }}>
                            {s.dependenciesAdded + s.dependenciesModified + s.dependenciesRemoved} dep{(s.dependenciesAdded + s.dependenciesModified + s.dependenciesRemoved) !== 1 ? 's' : ''}
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.2 }}>
                        {revision.createdBy.name ?? revision.createdBy.email} · {formatDistanceToNow(new Date(revision.createdAt), { addSuffix: true })}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.25, lineHeight: 1 }}>
                        {format(new Date(revision.createdAt), 'MMM d, yyyy · h:mm a')}
                      </Typography>
                    </Box>
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
