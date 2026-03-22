'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronsUpDown, Search, Check, Plus } from 'lucide-react';
import { Buildings } from '@phosphor-icons/react';
import { Box, Typography } from '@mui/material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Active';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export default function ProjectSwitcher() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const params = useParams<{ projectSlug?: string }>();
  const { projectSlug } = params;

  const { orgSlug, activeOrganizationId } = useOrgFromUrl();
  const { projects, currentProject, switchProject } = useProjectSwitcher(activeOrganizationId, orgSlug);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitch = (slug: string) => {
    switchProject(slug);
    setOpen(false);
    setSearch('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };

  return (
    <>
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      {/* Section wrapper with "PROJECT" label */}
      <Box sx={{ px: 1.5, pt: 1, pb: 1.5, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2, textTransform: 'uppercase', lineHeight: 1 }}>
          Project
        </Typography>

        <DropdownMenuTrigger asChild>
          <Box
            component="button"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              pt: '8px', pr: '8px', pb: '8px', pl: '10px',
              width: '100%',
              bgcolor: 'secondary.main',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {/* Project Icon */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '7px',
                bgcolor: 'accent.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Buildings size={16} color="white" />
            </Box>

            {/* Project Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '2px' }}>
              {projectSlug && currentProject ? (
                <>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    {currentProject.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: getStatusColor(currentProject.status), flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 9, fontWeight: 500, color: 'text.secondary', lineHeight: 1.2 }}>
                      {formatStatus(currentProject.status)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.2 }}>
                  No project selected
                </Typography>
              )}
            </Box>

            <ChevronsUpDown style={{ width: 14, height: 14, flexShrink: 0, color: 'inherit' }} />
          </Box>
        </DropdownMenuTrigger>
      </Box>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        style={{ width: 240, padding: 0, overflow: 'hidden' }}
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
              borderRadius: 2,
              color: 'text.secondary',
            }}
          >
            <Search style={{ width: 14, height: 14, color: 'inherit', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
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
                  borderRadius: 2,
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
                  }}
                />
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
                {isActive && (
                  <Check style={{ width: 14, height: 14, flexShrink: 0, color: 'inherit' }} />
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
          onClick={() => { setOpen(false); setCreateDialogOpen(true); }}
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
      </DropdownMenuContent>
    </DropdownMenu>

    <AddProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
