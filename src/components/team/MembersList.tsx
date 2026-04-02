'use client';

import { motion } from 'framer-motion';
import { Box, Typography, Avatar, Skeleton } from '@mui/material';
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

  const getRoleDescription = (role: string): string => {
    switch (role) {
      case 'owner':
        return 'Full access — manage members, roles, projects, and organization settings';
      case 'admin':
        return 'Manage members, roles, and projects — cannot change organization settings';
      case 'project_manager':
        return 'Create and manage projects — cannot manage members or roles';
      case 'member':
        return 'View projects they are invited to';
      case 'viewer':
        return 'View-only access to assigned projects';
      default:
        return '';
    }
  };

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
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {[1, 2].map((i) => (
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
            <Skeleton variant="circular" width={38} height={38} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="rounded" width={120} height={14} sx={{ borderRadius: '4px' }} />
                <Skeleton variant="rounded" width={50} height={18} sx={{ borderRadius: '999px' }} />
              </Box>
              <Skeleton variant="rounded" width={180} height={12} sx={{ borderRadius: '4px', mt: 0.75 }} />
            </Box>
          </Box>
        ))}
      </Box>
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
      sx={{ display: 'flex', flexDirection: 'column' }}
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
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: theme.palette.primary.contrastText,
              fontWeight: 600,
              fontSize: '0.8125rem',
            }}
          >
            {!member.user.image && getInitials(member.user.name, member.user.email)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {member.user.name || member.user.email}
              </Typography>
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: '999px',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  ...getRoleBadgeStyle(member.role),
                }}
              >
                {formatRole(member.role)}
              </Box>
            </Box>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {member.user.email}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'text.disabled',
                mt: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getRoleDescription(member.role)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
