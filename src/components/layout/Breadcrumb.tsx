'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import ProjectSwitcher from './ProjectSwitcher';
import { projectNavItems } from './navItems';

const PROJECT_PAGE_LABELS: Record<string, string> = Object.fromEntries(
  projectNavItems.map((item) => [item.segment, item.label]),
);

function getTrailingLabel(segment: string | undefined): string | null {
  if (!segment) return null;
  return PROJECT_PAGE_LABELS[segment] ?? null;
}

export default function Breadcrumb() {
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const pathname = usePathname();
  const { orgSlug, projectSlug } = params;

  // Determine the trailing page segment. For project routes, it's the segment after [projectSlug].
  // For org-root, there is no trailing segment.
  const segments = pathname.split('/').filter(Boolean);
  const projectIdx = segments.indexOf('projects');
  const trailingSegment =
    projectIdx >= 0 && projectSlug ? segments[projectIdx + 2] : undefined;
  const trailingLabel = getTrailingLabel(trailingSegment);

  // Org root — show a single static "Dashboard" crumb.
  if (!projectSlug) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '14.5px',
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1,
            letterSpacing: '-0.005em',
            px: 1,
            py: 0.75,
            userSelect: 'none',
          }}
        >
          Dashboard
        </Typography>
      </Box>
    );
  }

  // Inside a project — render: Projects / [Project chip] / [trailing static label?]
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125, minWidth: 0 }}>
      {/* "Projects" crumb — links back to the org root for now (will retarget to /projects in Phase 2) */}
      <Box
        component={Link}
        href={`/${orgSlug}`}
        sx={{
          fontSize: '14.5px',
          color: 'text.secondary',
          textDecoration: 'none',
          px: 1,
          py: 0.75,
          borderRadius: '6px',
          lineHeight: 1,
          transition: 'background-color 0.15s, color 0.15s',
          '&:hover': {
            bgcolor: 'action.hover',
            color: 'text.primary',
          },
        }}
      >
        Projects
      </Box>

      <Separator />

      {/* Active project chip — outlined button that opens the project switcher */}
      <ProjectSwitcher />

      {trailingLabel && (
        <>
          <Separator />
          <Typography
            sx={{
              fontSize: '14.5px',
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1,
              letterSpacing: '-0.005em',
              px: 1,
              py: 0.75,
              userSelect: 'none',
            }}
          >
            {trailingLabel}
          </Typography>
        </>
      )}
    </Box>
  );
}

function Separator() {
  return (
    <Typography
      component="span"
      aria-hidden="true"
      sx={{
        color: 'text.disabled',
        fontSize: '17px',
        fontWeight: 300,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      /
    </Typography>
  );
}
