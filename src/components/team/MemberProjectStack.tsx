'use client';

import { useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ProjectAvatar from '@/components/ui/ProjectAvatar';
import ProjectMembershipPopover from '@/components/team/ProjectMembershipPopover';
import { formatRole } from '@/lib/utils/formatting';
import { VALID_PROJECT_COLORS } from '@/lib/constants/projectColors';

export interface MemberProject {
  /** ProjectMember row id (used to remove this user from this project). */
  memberId: string;
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  imageUrl: string | null;
  role: string;
}

interface MemberProjectStackProps {
  projects: MemberProject[];
  currentProjectId?: string;
  /** Display name for popover copy. */
  userName: string;
  /** When true, thumbnails are clickable and open a manage-membership popover. */
  canManage?: boolean;
  maxVisible?: number;
}

const TILE_SIZE = 24;

/**
 * Stable per-project color when no explicit color is set, so avatars in a stack
 * stay visually distinct instead of collapsing into identical icons.
 */
function stableColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return VALID_PROJECT_COLORS[Math.abs(hash) % VALID_PROJECT_COLORS.length]!;
}

export default function MemberProjectStack({
  projects,
  currentProjectId,
  userName,
  canManage = false,
  maxVisible = 5,
}: MemberProjectStackProps) {
  const theme = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const [popoverState, setPopoverState] = useState<{
    anchor: HTMLElement;
    project: MemberProject;
  } | null>(null);

  if (projects.length === 0) return null;

  const sorted = [...projects].sort((a, b) => {
    if (a.id === currentProjectId) return -1;
    if (b.id === currentProjectId) return 1;
    return a.name.localeCompare(b.name);
  });

  const visible = sorted.slice(0, maxVisible);
  const hiddenCount = sorted.length - visible.length;

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          pl: 0.5,
          pr: 1.25,
          py: 0.5,
          bgcolor: 'transparent',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '999px',
          userSelect: 'none',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: alpha(theme.palette.text.primary, 0.16),
          },
        }}
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          {visible.map((project, idx) => (
            <ProjectThumb
              key={project.id}
              project={project}
              isCurrent={project.id === currentProjectId}
              isFirst={idx === 0}
              spread={isHovering}
              clickable={canManage}
              onClick={(anchor) =>
                canManage && setPopoverState({ anchor, project })
              }
            />
          ))}
          {hiddenCount > 0 && (
            <Box
              sx={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                ml: isHovering ? 0.5 : '-8px',
                transition: 'margin-left 0.18s ease',
                borderRadius: '6px',
                bgcolor: 'background.paper',
                color: 'text.secondary',
                fontSize: '0.625rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 0 1.5px ${theme.palette.background.paper}`,
                border: `1px dashed ${theme.palette.divider}`,
              }}
            >
              +{hiddenCount}
            </Box>
          )}
        </Box>

        <Typography
          sx={{
            fontSize: '0.75rem',
            color: 'text.secondary',
            lineHeight: 1,
          }}
        >
          <Box component="strong" sx={{ color: 'text.primary', mr: 0.5, fontWeight: 600 }}>
            {projects.length}
          </Box>
          {projects.length === 1 ? 'project' : 'projects'}
        </Typography>
      </Box>

      {popoverState && (
        <ProjectMembershipPopover
          anchorEl={popoverState.anchor}
          onClose={() => setPopoverState(null)}
          memberId={popoverState.project.memberId}
          projectId={popoverState.project.id}
          projectName={popoverState.project.name}
          userName={userName}
          role={popoverState.project.role}
        />
      )}
    </Box>
  );
}

function ProjectThumb({
  project,
  isCurrent,
  isFirst,
  spread,
  clickable,
  onClick,
}: {
  project: MemberProject;
  isCurrent: boolean;
  isFirst: boolean;
  spread: boolean;
  clickable: boolean;
  onClick: (anchor: HTMLElement) => void;
}) {
  const theme = useTheme();

  const tooltip = `${project.name} · ${formatRole(project.role)}${
    isCurrent ? ' · Current' : ''
  }${clickable ? ' · click to manage' : ''}`;

  const resolvedColor = project.color ?? stableColorForId(project.id);

  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box
        component={clickable ? 'button' : 'div'}
        type={clickable ? 'button' : undefined}
        onClick={
          clickable
            ? (e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                onClick(e.currentTarget);
              }
            : undefined
        }
        sx={{
          position: 'relative',
          width: TILE_SIZE,
          height: TILE_SIZE,
          ml: isFirst ? 0 : spread ? 0.5 : '-8px',
          transition:
            'margin-left 0.18s ease, transform 0.18s ease, filter 0.15s ease',
          borderRadius: '6px',
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: clickable ? 'pointer' : 'default',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          // White ring around each tile so overlapping projects stay visually
          // distinct against both the pill background and each other.
          boxShadow: `0 0 0 1.5px ${theme.palette.background.paper}`,
          '&:hover': clickable
            ? {
                transform: 'translateY(-2px)',
                zIndex: 2,
                filter: 'brightness(0.95) saturate(1.2)',
              }
            : undefined,
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <ProjectAvatar
          imageUrl={project.imageUrl}
          icon={project.icon ?? undefined}
          colorId={resolvedColor}
          size={TILE_SIZE}
          borderRadius="6px"
        />
        {isCurrent && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: theme.palette.success.main,
              boxShadow: `0 0 0 1.5px ${theme.palette.background.paper}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}
