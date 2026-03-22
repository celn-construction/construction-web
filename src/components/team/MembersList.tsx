'use client';

import { motion } from 'framer-motion';
import { Box, Typography, Avatar, Skeleton, Stack } from '@mui/material';
import { formatRole } from '@/lib/utils/formatting';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MembersListProps {
  members: Member[];
  isLoading: boolean;
}

export default function MembersList({ members, isLoading }: MembersListProps) {
  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.75,
              borderRadius: '12px',
            }}
          >
            <Skeleton variant="circular" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="33%" height={16} sx={{ mb: 0.5 }} />
              <Skeleton width="50%" height={12} />
            </Box>
            <Skeleton width={80} height={24} />
          </Box>
        ))}
      </Stack>
    );
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.04,
          },
        },
      }}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {members.map((member) => (
        <Box
          key={member.id}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.75,
            borderRadius: '12px',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Avatar
            src={member.user.image || undefined}
            alt={member.user.name || member.user.email}
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'text.primary',
              color: 'background.paper',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            {!member.user.image && getInitials(member.user.name, member.user.email)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {member.user.name || member.user.email}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.disabled',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {member.user.email}
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              bgcolor: 'action.hover',
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              borderLeft: 2,
              borderColor: 'divider',
            }}
          >
            {formatRole(member.role)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
