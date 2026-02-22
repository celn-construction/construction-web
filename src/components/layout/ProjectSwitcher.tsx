'use client';

import { useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Building2, ChevronDown, Search, Check, Plus } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/trpc/react';

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  in_progress: '#F59E0B',
  on_hold: '#8D99AE',
  completed: '#3B82F6',
  archived: '#8D99AE',
};

function getStatusColor(status: string | null | undefined): string {
  return status ? (STATUS_COLORS[status] ?? '#8D99AE') : '#8D99AE';
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Active';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export default function ProjectSwitcher() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const pathname = usePathname();
  const { orgSlug, projectSlug } = params;

  const { data: organizations = [] } = api.organization.list.useQuery(undefined, { retry: false });
  const currentOrg = organizations.find((o) => o.slug === orgSlug);

  const { data: projects = [] } = api.project.list.useQuery(
    { organizationId: currentOrg?.id ?? '' },
    { enabled: !!currentOrg?.id, retry: false }
  );

  const currentProject = projects.find((p) => p.slug === projectSlug);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitch = (slug: string) => {
    const section = projectSlug
      ? (pathname.split(`/projects/${projectSlug}/`)[1]?.split('/')[0] ?? 'gantt')
      : 'gantt';
    router.push(`/${orgSlug}/projects/${slug}/${section}`);
    setOpen(false);
    setSearch('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Box
          component="button"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.75,
            py: 1,
            width: '100%',
            bgcolor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {/* Project Icon */}
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '7px',
              bgcolor: 'secondary.main',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 style={{ width: 14, height: 14, color: '#1A1A2E' }} />
          </Box>

          {/* Project Info */}
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '1px' }}>
            {projectSlug && currentProject ? (
              <>
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#1A1A2E',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {currentProject.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    color: '#2B2D42',
                    lineHeight: 1.2,
                    textTransform: 'capitalize',
                  }}
                >
                  {formatStatus(currentProject.status)}
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled', lineHeight: 1.2 }}>
                No project selected
              </Typography>
            )}
          </Box>

          <ChevronDown style={{ width: 14, height: 14, flexShrink: 0, color: '#8D99AE' }} />
        </Box>
      </DropdownMenuTrigger>

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
              color: '#8D99AE',
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
            }}
          >
            <Search style={{ width: 14, height: 14, color: '#8D99AE', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '0.8125rem',
                color: '#1A1A2E',
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
                    color: '#1A1A2E',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.name}
                </Typography>
                {isActive && (
                  <Check style={{ width: 14, height: 14, color: '#2B2D42', flexShrink: 0 }} />
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
          onClick={() => { router.push(`/${orgSlug}`); setOpen(false); }}
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
          <Plus style={{ width: 14, height: 14, color: '#8D99AE' }} />
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#8D99AE' }}>
            Create new project
          </Typography>
        </Box>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
