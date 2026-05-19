'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Tooltip,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ChartBar as TimelineIcon,
  MapPin as MapIcon,
  ListBullets as ListIcon,
  Plus as PlusIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ProjectsListPane from '@/components/projects/ProjectsListPane';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

const ProjectsMap = dynamic(() => import('@/components/projects/ProjectsMap'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: '12px',
      }}
    >
      <LoadingSpinner size="md" />
    </Box>
  ),
});

type ViewMode = 'timeline' | 'map' | 'list';

const VIEW_MODES: ReadonlyArray<{ id: ViewMode; label: string; Icon: typeof TimelineIcon }> = [
  { id: 'timeline', label: 'Timeline', Icon: TimelineIcon },
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'list', label: 'List', Icon: ListIcon },
];

function isViewMode(v: string | null): v is ViewMode {
  return v === 'timeline' || v === 'map' || v === 'list';
}

export default function ProjectsView({ orgSlug }: { orgSlug: string }) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrganizationId } = useOrgFromUrl();

  const viewParam = searchParams.get('view');
  const view: ViewMode = isViewMode(viewParam) ? viewParam : 'timeline';

  const [addProjectOpen, setAddProjectOpen] = useState(false);

  const { data: projects = [], isLoading } = api.project.list.useQuery(
    { organizationId: activeOrganizationId ?? '' },
    { enabled: !!activeOrganizationId, retry: false },
  );

  const { data: activeProject } = api.project.getActive.useQuery(
    { organizationId: activeOrganizationId ?? '' },
    { enabled: !!activeOrganizationId, retry: false },
  );

  const setView = useCallback(
    (next: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const mapped = useMemo(
    () => projects.filter((p) => p.latitude != null && p.longitude != null),
    [projects],
  );
  const unmapped = useMemo(
    () => projects.filter((p) => p.latitude == null || p.longitude == null),
    [projects],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 3, gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexShrink: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.5rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}
          >
            Projects
          </Typography>
          {activeProject && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                mt: 0.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              Currently in{' '}
              <Box
                component="span"
                sx={{ color: 'text.primary', fontWeight: 600 }}
              >
                {activeProject.name}
              </Box>
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* View toggle */}
          <Box
            role="tablist"
            aria-label="Projects view"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              p: '3px',
              bgcolor: alpha(theme.palette.divider, 0.12),
              borderRadius: '8px',
            }}
          >
            {VIEW_MODES.map(({ id, label, Icon }) => {
              const isActive = view === id;
              return (
                <Tooltip key={id} title={label} placement="bottom" arrow>
                  <Box
                    component="button"
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setView(id)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.625,
                      py: 0.5,
                      px: 1.25,
                      border: 0,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      bgcolor: isActive ? 'background.paper' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      boxShadow: isActive ? `0 1px 3px ${alpha('#000', 0.08)}` : 'none',
                      transition: 'background-color 0.15s, color 0.15s',
                      '&:hover': {
                        color: isActive ? 'primary.main' : 'text.primary',
                      },
                    }}
                  >
                    <Icon size={13} weight={isActive ? 'fill' : 'regular'} />
                    {label}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>

          {/* New project */}
          <Box
            component="button"
            type="button"
            onClick={() => setAddProjectOpen(true)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.625,
              py: 0.75,
              px: 1.5,
              border: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '8px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.25)}`,
              transition: 'background-color 0.15s, box-shadow 0.15s',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              },
            }}
          >
            <PlusIcon size={13} weight="bold" />
            New project
          </Box>
        </Box>
      </Box>

      {/* Body */}
      {isLoading ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner size="md" />
        </Box>
      ) : projects.length === 0 ? (
        <EmptyState orgSlug={orgSlug} onAddProject={() => setAddProjectOpen(true)} />
      ) : view === 'map' ? (
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0, gap: 2 }}>
          <Box sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ProjectsListPane
              orgSlug={orgSlug}
              mapped={mapped}
              unmapped={unmapped}
              selectedProjectId={selectedProjectId}
              activeProjectId={activeProject?.id ?? null}
              onSelect={setSelectedProjectId}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
            }}
          >
            <ProjectsMap
              orgSlug={orgSlug}
              projects={mapped}
              activeProjectId={activeProject?.id ?? null}
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />
          </Box>
        </Box>
      ) : view === 'list' ? (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Box sx={{ maxWidth: 720 }}>
            <ProjectsListPane
              orgSlug={orgSlug}
              mapped={mapped}
              unmapped={unmapped}
              selectedProjectId={selectedProjectId}
              activeProjectId={activeProject?.id ?? null}
              onSelect={setSelectedProjectId}
            />
          </Box>
        </Box>
      ) : (
        // Timeline placeholder — full timeline UI lives behind a separate sketch
        <TimelinePlaceholder orgSlug={orgSlug} projects={projects} />
      )}

      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </Box>
  );
}

// ── Timeline placeholder ─────────────────────────────────────────────────────

function TimelinePlaceholder({
  orgSlug,
  projects,
}: {
  orgSlug: string;
  projects: ReadonlyArray<{ id: string; name: string; slug: string; status: string; completionPercent: number }>;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {projects.map((p) => {
        const statusColor =
          p.status === 'completed'
            ? theme.palette.status.completed
            : p.status === 'inProgress' || p.status === 'in-progress'
              ? theme.palette.status.inProgress
              : p.status === 'on-hold'
                ? theme.palette.status.onHold
                : theme.palette.status.active;
        return (
          <Link
            key={p.id}
            href={`/${orgSlug}/projects/${p.slug}/gantt`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
                borderRadius: '10px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'background-color 0.15s, border-color 0.15s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '999px',
                  bgcolor: statusColor,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 80,
                  height: 4,
                  borderRadius: '999px',
                  bgcolor: alpha(theme.palette.divider, 0.4),
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: `${p.completionPercent}%`,
                    bgcolor: 'primary.main',
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  width: 36,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {p.completionPercent}%
              </Typography>
            </Box>
          </Link>
        );
      })}
    </Box>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  orgSlug: _orgSlug,
  onAddProject,
}: {
  orgSlug: string;
  onAddProject: () => void;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        color: 'text.secondary',
      }}
    >
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}>
        No projects yet
      </Typography>
      <Typography sx={{ fontSize: '0.75rem' }}>Create your first project to get started.</Typography>
      <Box
        component="button"
        type="button"
        onClick={onAddProject}
        sx={{
          mt: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.625,
          py: 0.875,
          px: 2,
          border: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.8125rem',
          fontWeight: 600,
          borderRadius: '8px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.25)}`,
          '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` },
        }}
      >
        <PlusIcon size={13} weight="bold" />
        New project
      </Box>
    </Box>
  );
}
