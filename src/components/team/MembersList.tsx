'use client';

import { motion } from 'framer-motion';
import { Box, Typography, Avatar, Skeleton, Stack } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
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
  const theme = useTheme();

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        };
      case 'admin':
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.07),
          color: theme.palette.primary.main,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        };
      default:
        return {
          bgcolor: 'action.hover',
          color: 'text.secondary',
          border: `1px solid ${theme.palette.divider}`,
        };
    }
  };

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
            <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: '10px' }} />
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
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: theme.palette.primary.contrastText,
              fontWeight: 600,
              fontSize: '0.8125rem',
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
              whiteSpace: 'nowrap',
              ...getRoleBadgeStyle(member.role),
            }}
          >
            {formatRole(member.role)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
