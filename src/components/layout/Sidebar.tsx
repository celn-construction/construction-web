'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { ChevronsUpDown } from 'lucide-react';
import { ChartBar, FolderSimple, FileMagnifyingGlass, Users, type Icon } from '@phosphor-icons/react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { projectNavItems, getProjectNavHref } from './navItems';
import OrgSwitcher from './OrgSwitcher';
import ProjectSwitcher from './ProjectSwitcher';
import { authClient } from '@/lib/auth-client';

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

const iconMap: Record<string, Icon> = {
  ChartBar,
  FolderSimple,
  FileMagnifyingGlass,
  Users,
};

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const { orgSlug, projectSlug } = params;

  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <Box
      component="aside"
      sx={{
        height: '100vh',
        width: 220,
        bgcolor: 'sidebar.background',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        transition: 'background-color 0.15s',
        borderRight: '1px solid',
        borderColor: 'sidebar.border',
      }}
    >
      {/* Org Header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <OrgSwitcher />
        <Box sx={{ height: '1px', bgcolor: 'divider' }} />
        <ProjectSwitcher />
      </Box>

      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          px: 1.5,
          py: 1,
          overflow: 'hidden',
        }}
      >
        <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {projectNavItems.map((item) => {
            const Icon = iconMap[item.icon] ?? ChartBar;
            const href = getProjectNavHref(item.segment, orgSlug, projectSlug);
            const isActive = !!(projectSlug && pathname.includes(`/projects/${projectSlug}/${item.segment}`));
            const isDisabled = !projectSlug;

            return (
              <ListItemButton
                key={item.id}
                component={isDisabled ? 'div' : Link}
                href={href}
                disabled={isDisabled}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  transition: 'all 0.15s',
                  border: '1px solid',
                  borderColor: isActive ? 'divider' : 'transparent',
                  bgcolor: isActive ? 'sidebar.activeItemBg' : 'transparent',
                  color: isActive ? '#1A1A2E' : '#8D99AE',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'default' : 'pointer',
                  '&:hover': {
                    bgcolor: isDisabled ? 'transparent' : (isActive ? 'sidebar.activeItemBg' : 'sidebar.hoverBg'),
                    color: isDisabled ? '#8D99AE' : '#1A1A2E',
                    borderColor: isActive ? 'divider' : 'transparent',
                  },
                  '&.MuiListItemButton-root:hover': {
                    bgcolor: isDisabled ? 'transparent' : (isActive ? 'sidebar.activeItemBg' : 'sidebar.hoverBg'),
                  },
                }}
              >
                {isActive && (
                  <Box
                    sx={{ width: 3, height: 18, borderRadius: '2px', bgcolor: '#2B2D42', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                )}
                <ListItemIcon sx={{ minWidth: 18, color: 'inherit' }}>
                  <Icon size={18} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 500 : 400,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* User Row */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.75,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '999px',
            bgcolor: 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: '#1A1A2E',
          }}
        >
          {getInitials(user?.name)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '1px' }}>
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
            {user?.name ?? 'User'}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: '#8D99AE',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {user?.email ?? ''}
          </Typography>
        </Box>

        <ChevronsUpDown style={{ width: 14, height: 14, flexShrink: 0, color: '#8D99AE' }} />
      </Box>
    </Box>
  );
}
