'use client';

import { useState, useRef } from 'react';
import { Box, Typography, Popover } from '@mui/material';
import { ClockCounterClockwise, FloppyDisk, GitDiff, CheckCircle } from '@phosphor-icons/react';
import { useGanttChangesStore, useGanttChangesListener } from '@/store/ganttChangesStore';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import type { Role } from '@/lib/permissions';
import { api } from '@/trpc/react';
import SaveVersionDialog from './SaveVersionDialog';
import VersionHistoryDrawer from './VersionHistoryDrawer';

export default function VersionControlBar() {
  const { projectId } = useProjectContext();
  const { currentOrg } = useOrgFromUrl();
  const memberRole = (currentOrg?.role ?? 'viewer') as Role;

  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [changesAnchorEl, setChangesAnchorEl] = useState<HTMLElement | null>(null);
  const changesRef = useRef<HTMLDivElement>(null);

  useGanttChangesListener();
  const { hasChanges, changeCount, added, modified, removed, activeVersionName } = useGanttChangesStore();

  const { data: versions } = api.schedule.listVersions.useQuery(
    { projectId },
    { enabled: !!projectId },
  );
  // Use context's activeVersionName (set on save/restore) if available, else fall back to latest from query
  const displayVersionName = activeVersionName ?? versions?.[0]?.name ?? null;

  const handleChangesClick = () => {
    if (hasChanges && changesRef.current) {
      setChangesAnchorEl(changesRef.current);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* ── Changes pill ── */}
          {/* This is the hero: a standalone pill that shows change state */}
          {/* When dirty, it's clickable and opens the diff popover directly */}
          <Box
            ref={changesRef}
            onClick={handleChangesClick}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.625,
              height: 30,
              px: 1.25,
              borderRadius: '8px',
              bgcolor: hasChanges ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
              border: '1px solid',
              borderColor: hasChanges ? 'rgba(217, 119, 6, 0.20)' : 'transparent',
              cursor: hasChanges ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              ...(hasChanges && {
                '&:hover': {
                  bgcolor: 'rgba(217, 119, 6, 0.13)',
                  borderColor: 'rgba(217, 119, 6, 0.30)',
                },
              }),
            }}
          >
            {hasChanges ? (
              <>
                <GitDiff size={13} weight="bold" color="var(--status-amber)" style={{ flexShrink: 0 }} />
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--status-amber)',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {changeCount} change{changeCount !== 1 ? 's' : ''}
                </Typography>
              </>
            ) : (
              <>
                <CheckCircle size={12} weight="fill" style={{ flexShrink: 0, color: 'var(--status-green)', opacity: 0.5 }} />
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    color: 'text.disabled',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  All saved
                </Typography>
              </>
            )}
          </Box>

          {/* ── Main control bar ── */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
              height: 34,
              overflow: 'hidden',
            }}
          >
            {/* Version name — clickable to open history */}
            <Box
              onClick={() => setVersionHistoryOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.625,
                pl: 1.25,
                pr: 1,
                height: '100%',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              <ClockCounterClockwise size={12} weight="bold" style={{ flexShrink: 0, opacity: 0.35 }} />
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}
              >
                {displayVersionName ?? 'No versions'}
              </Typography>
            </Box>

            {/* Separator */}
            <Box sx={{ width: '1px', height: 14, bgcolor: 'divider', flexShrink: 0 }} />

            {/* Save button */}
            <Box
              component="button"
              onClick={() => setSaveVersionOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                height: '100%',
                border: 'none',
                borderRadius: '0 9px 9px 0',
                bgcolor: hasChanges ? 'var(--accent-primary)' : 'transparent',
                color: hasChanges ? '#fff' : 'text.secondary',
                cursor: 'pointer',
                fontSize: '0.6875rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
                transition: 'background-color 0.2s, color 0.2s, filter 0.2s',
                '&:hover': {
                  bgcolor: hasChanges ? 'var(--accent-primary)' : 'action.hover',
                  filter: hasChanges ? 'brightness(0.85)' : 'none',
                },
              }}
            >
              <FloppyDisk size={12} weight={hasChanges ? 'fill' : 'regular'} />
              Save
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Changes diff popover — anchored to the changes pill */}
      <Popover
        open={!!changesAnchorEl}
        anchorEl={changesAnchorEl}
        onClose={() => setChangesAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: '12px',
              minWidth: 240,
              maxWidth: 320,
              maxHeight: 380,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid var(--border-color)',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <GitDiff size={14} weight="bold" color="var(--status-amber)" />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {changeCount} Unsaved Change{changeCount !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Change list */}
        <Box sx={{ overflow: 'auto', maxHeight: 300 }}>
          {added.length > 0 && (
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography
                sx={{
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  color: 'var(--status-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  mb: 0.5,
                }}
              >
                Added · {added.length}
              </Typography>
              {added.slice(0, 8).map((name, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'var(--status-green)', flexShrink: 0, opacity: 0.6 }} />
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </Typography>
                </Box>
              ))}
              {added.length > 8 && (
                <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', pl: 1.5, mt: 0.25 }}>
                  +{added.length - 8} more
                </Typography>
              )}
            </Box>
          )}

          {modified.length > 0 && (
            <Box sx={{ px: 2, py: 1.25, ...(added.length > 0 && { borderTop: '1px solid var(--border-light)' }) }}>
              <Typography
                sx={{
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  color: 'var(--status-amber)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  mb: 0.5,
                }}
              >
                Modified · {modified.length}
              </Typography>
              {modified.slice(0, 8).map((name, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'var(--status-amber)', flexShrink: 0, opacity: 0.6 }} />
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </Typography>
                </Box>
              ))}
              {modified.length > 8 && (
                <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', pl: 1.5, mt: 0.25 }}>
                  +{modified.length - 8} more
                </Typography>
              )}
            </Box>
          )}

          {removed.length > 0 && (
            <Box sx={{ px: 2, py: 1.25, ...((added.length > 0 || modified.length > 0) && { borderTop: '1px solid var(--border-light)' }) }}>
              <Typography
                sx={{
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  color: 'var(--status-red)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  mb: 0.5,
                }}
              >
                Removed · {removed.length}
              </Typography>
              {removed.slice(0, 8).map((name, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'var(--status-red)', flexShrink: 0, opacity: 0.6 }} />
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </Typography>
                </Box>
              ))}
              {removed.length > 8 && (
                <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', pl: 1.5, mt: 0.25 }}>
                  +{removed.length - 8} more
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Popover>

      {/* Dialogs */}
      <SaveVersionDialog
        open={saveVersionOpen}
        onOpenChange={setSaveVersionOpen}
        projectId={projectId}
      />
      <VersionHistoryDrawer
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        projectId={projectId}
        memberRole={memberRole}
      />
    </>
  );
}
