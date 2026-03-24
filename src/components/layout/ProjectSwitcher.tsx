'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ChevronsUpDown, Search, Check, Plus } from 'lucide-react';
import { Buildings } from '@phosphor-icons/react';
import { Box, Typography, Menu, ButtonBase } from '@mui/material';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import { useProjectSwitcher } from '@/hooks/useProjectSwitcher';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

const STATUS_COLORS: Record<string, string> = {
  active: 'status.active',
  in_progress: 'status.inProgress',
  on_hold: 'status.onHold',
  completed: 'status.completed',
  archived: 'status.archived',
};

function getStatusColor(status: string | null | undefined): string {
  return status ? (STATUS_COLORS[status] ?? 'status.onHold') : 'status.onHold';
}

export default function ProjectSwitcher() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const params = useParams<{ projectSlug?: string }>();
  const { projectSlug } = params;

  const { orgSlug, activeOrganizationId } = useOrgFromUrl();
  const { projects, currentProject, switchProject } = useProjectSwitcher(activeOrganizationId, orgSlug);

  const open = Boolean(anchorEl);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitch = (slug: string) => {
    switchProject(slug);
    setAnchorEl(null);
    setSearch('');
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearch('');
  };

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          px: 1,
          py: 0.5,
          borderRadius: '8px',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: 'action.selected' },
        }}
      >
        <Buildings size={15} style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.secondary', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
          {projectSlug && currentProject ? currentProject.name : 'Select project'}
        </Typography>
        <ChevronsUpDown style={{ width: 12, height: 12, flexShrink: 0, color: 'var(--mui-palette-text-disabled)' }} />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { width: 240, p: 0, overflow: 'hidden', mt: 0.5 },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 1.75, pt: 1.5, pb: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Switch Project
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{ px: 1, pb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 1,
              bgcolor: 'secondary.main',
              borderRadius: '12px',
              color: 'text.secondary',
            }}
          >
            <Search style={{ width: 14, height: 14, color: 'inherit', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '0.8125rem',
                color: 'inherit',
                width: '100%',
                fontFamily: 'inherit',
              }}
            />
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'divider' }} />

        {/* Project List */}
        <Box sx={{ py: 0.5, px: 0.75, maxHeight: 220, overflowY: 'auto' }}>
          {filtered.map((project) => {
            const isActive = project.slug === projectSlug;
            return (
              <Box
                key={project.id}
                component="button"
                onClick={() => handleSwitch(project.slug)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  width: '100%',
                  px: 1.25,
                  py: 1,
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  bgcolor: isActive ? 'secondary.main' : 'transparent',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: getStatusColor(project.status),
                    mt: 0.25,
                    alignSelf: 'flex-start',
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 500 : 400,
                        color: 'text.primary',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', flexShrink: 0 }}>
                      {project.completionPercent}%
                    </Typography>
                  </Box>
                  {/* Progress bar */}
                  <Box sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${project.completionPercent}%`,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
                {isActive && (
                  <Check style={{ width: 14, height: 14, flexShrink: 0, color: 'inherit', alignSelf: 'flex-start', marginTop: 2 }} />
                )}
              </Box>
            );
          })}
          {filtered.length === 0 && (
            <Typography sx={{ px: 1.25, py: 1, fontSize: '0.8125rem', color: 'text.disabled' }}>
              No projects found
            </Typography>
          )}
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'divider' }} />

        {/* Create new project */}
        <Box
          component="button"
          onClick={() => { setAnchorEl(null); setCreateDialogOpen(true); }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 1.25,
            width: '100%',
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Plus style={{ width: 14, height: 14, color: 'inherit' }} />
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.secondary' }}>
            Create new project
          </Typography>
        </Box>
      </Menu>

      <AddProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
