'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CaretUpDown, MagnifyingGlass, Check, Plus } from '@phosphor-icons/react';
import { Box, Typography, Menu, ButtonBase, alpha, useTheme } from '@mui/material';
import ProjectAvatar from '@/components/ui/ProjectAvatar';
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
  const theme = useTheme();

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

  const hasProject = !!(projectSlug && currentProject);

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          pl: 0.75,
          pr: 1,
          py: 0.875,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s',
          color: 'text.primary',
          fontSize: '14.5px',
          fontWeight: 600,
          letterSpacing: '-0.005em',
          lineHeight: 1,
          minWidth: 0,
          maxWidth: 320,
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.8) : '#d4d4d4',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          },
        }}
      >
        <ProjectAvatar
          imageUrl={currentProject?.imageUrl}
          icon={currentProject?.icon}
          size={22}
          borderRadius="5px"
          color="var(--text-secondary)"
        />
        <Typography
          component="span"
          sx={{
            fontSize: '14.5px',
            fontWeight: 600,
            letterSpacing: '-0.005em',
            color: hasProject ? 'text.primary' : 'text.secondary',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {hasProject ? currentProject.name : 'Select project'}
        </Typography>
        <CaretUpDown size={14} style={{ flexShrink: 0, color: 'var(--text-secondary)' }} />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { width: 280, p: 0, overflow: 'hidden', mt: 0.5, borderRadius: '12px' },
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
              borderRadius: '10px',
              color: 'text.secondary',
            }}
          >
            <MagnifyingGlass size={14} style={{ color: 'inherit', flexShrink: 0 }} />
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
        <Box sx={{ py: 0.5, px: 0.75, maxHeight: 340, overflowY: 'auto' }}>
          {filtered.map((project) => {
            const isActive = project.slug === projectSlug;
            const hasImage = !!project.imageUrl;
            return (
              <Box
                key={project.id}
                component="button"
                onClick={() => handleSwitch(project.slug)}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                  width: '100%',
                  borderRadius: '10px',
                  border: '1.5px solid',
                  borderColor: isActive
                    ? alpha(theme.palette.primary.main, 0.25)
                    : 'transparent',
                  cursor: 'pointer',
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, 0.04)
                    : 'transparent',
                  textAlign: 'left',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                  mb: 0.5,
                  p: 0,
                  '&:hover': {
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.06)
                      : 'action.hover',
                    borderColor: isActive
                      ? alpha(theme.palette.primary.main, 0.35)
                      : alpha(theme.palette.divider, 0.5),
                  },
                }}
              >
                {/* Project image/icon thumbnail */}
                <Box
                  sx={{
                    width: 56,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: hasImage
                      ? 'transparent'
                      : alpha(theme.palette.divider, 0.06),
                    overflow: 'hidden',
                  }}
                >
                  {hasImage ? (
                    <Box
                      component="img"
                      src={project.imageUrl!}
                      alt=""
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <ProjectAvatar
                      icon={project.icon}
                      size={22}
                      borderRadius={0}
                      color={theme.palette.text.disabled}
                    />
                  )}
                </Box>

                {/* Project info */}
                <Box sx={{ flex: 1, minWidth: 0, py: 1, px: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(project.status),
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 500,
                        color: 'text.primary',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}
                    >
                      {project.name}
                    </Typography>
                    {isActive && (
                      <Check size={13} weight="bold" style={{ flexShrink: 0, color: theme.palette.primary.main }} />
                    )}
                  </Box>

                  {/* Progress bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
                    <Box sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: alpha(theme.palette.divider, 0.15), overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${project.completionPercent}%`,
                          borderRadius: 2,
                          bgcolor: isActive ? 'primary.main' : alpha(theme.palette.text.secondary, 0.35),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.secondary', flexShrink: 0, lineHeight: 1 }}>
                      {project.completionPercent}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
          {filtered.length === 0 && (
            <Typography sx={{ px: 1.25, py: 1, fontSize: '0.8125rem', color: 'text.secondary' }}>
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
          <Plus size={14} style={{ color: 'inherit' }} />
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.secondary' }}>
            Create new project
          </Typography>
        </Box>
      </Menu>

      <AddProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
