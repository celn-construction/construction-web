'use client';

import { Avatar, AvatarGroup, Tooltip, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface PresenceUser {
  clientId: string;
  data?: {
    name?: string;
    avatar?: string;
    joinedAt?: number;
  };
}

interface GanttPresenceProps {
  currentUserId: string;
  presenceData: PresenceUser[];
}

/**
 * Displays avatar bubbles of other users currently viewing the Gantt chart.
 * Renders in the toolbar area between the spacer and auto-save controls.
 */
export default function GanttPresence({ currentUserId, presenceData }: GanttPresenceProps) {
  const theme = useTheme();
  const otherUsers = presenceData.filter(p => p.clientId !== currentUserId);

  if (otherUsers.length === 0) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <AvatarGroup
        max={5}
        sx={{
          '& .MuiAvatar-root': {
            width: 24,
            height: 24,
            fontSize: 11,
            border: '2px solid var(--bg-card)',
          },
        }}
      >
        {otherUsers.map((user) => (
          <Tooltip key={user.clientId} title={`${user.data?.name ?? 'User'} is viewing`}>
            <Avatar
              src={user.data?.avatar}
              alt={user.data?.name}
              sx={{
                width: 24,
                height: 24,
                fontSize: 11,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {(user.data?.name ?? '?')[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
      <Typography
        sx={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {otherUsers.length} viewing
      </Typography>
    </Stack>
  );
}
