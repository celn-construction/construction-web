'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, GanttChart, Users, FolderOpen, FileSearch } from 'lucide-react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { orgNavItems, projectNavItems, getOrgNavHref, getProjectNavHref } from './navItems';
import { LogoIcon } from '@/components/ui/Logo';
import OrgSwitcher from './OrgSwitcher';

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const { orgSlug, projectSlug } = params;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'FolderOpen': return FolderOpen;
      case 'GanttChart': return GanttChart;
      case 'Users': return Users;
      case 'FileSearch': return FileSearch;
      default: return Home;
    }
  };

  return (
    <Box
      component="aside"
      sx={{
        height: '100vh',
        width: 208,
        bgcolor: 'sidebar.background',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        transition: 'colors 0.15s',
        boxShadow: 'inset -1px 0 0 0 var(--sidebar-border)',
      }}
    >
      {/* Branding Area */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'sidebar.border',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}
          >
            <LogoIcon size={18} />
          </Box>
          <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.primary' }}>
            BuildTrack
          </Typography>
        </Box>
        <OrgSwitcher />
      </Box>

      {/* Navigation */}
      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2, flex: 1 }}>
        {/* Organization Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            sx={{
              px: 1.5,
              mb: 0.5,
              fontSize: '0.625rem',
              letterSpacing: '0.1em',
              color: 'text.disabled',
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            Organization
          </Typography>
          <List sx={{ p: 0 }}>
            {orgNavItems.map((item) => {
              const Icon = getIcon(item.icon);
              const href = orgSlug ? getOrgNavHref(item.segment, orgSlug) : '#';
              const isActive = pathname === href || (item.segment === '' && pathname === `/${orgSlug}`);
              const isDisabled = !orgSlug;

              return (
                <ListItemButton
                  key={item.id}
                  component={isDisabled ? 'div' : Link}
                  href={href}
                  disabled={isDisabled}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    transition: 'all 0.15s',
                    bgcolor: isActive ? 'sidebar.activeBg' : 'transparent',
                    color: isActive ? 'text.primary' : 'text.secondary',
                    fontWeight: isActive ? 500 : 400,
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'default' : 'pointer',
                    '&:hover': {
                      bgcolor: isDisabled ? 'transparent' : (isActive ? 'sidebar.activeBg' : 'sidebar.hoverBg'),
                      color: isDisabled ? 'text.secondary' : 'text.primary',
                    },
                  }}
                >
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: 20,
                        borderRadius: '0 999px 999px 0',
                        bgcolor: 'sidebar.indicator',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <ListItemIcon sx={{ minWidth: 18, color: 'inherit' }}>
                    <Icon style={{ width: 18, height: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        {/* Project Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            sx={{
              px: 1.5,
              mb: 0.5,
              fontSize: '0.625rem',
              letterSpacing: '0.1em',
              color: 'text.disabled',
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            Project
          </Typography>
          <List sx={{ p: 0 }}>
            {projectNavItems.map((item) => {
              const Icon = getIcon(item.icon);
              const href = getProjectNavHref(item.segment, orgSlug, projectSlug);
              const isActive = projectSlug && pathname.includes(`/projects/${projectSlug}/${item.segment}`);
              const isDisabled = !projectSlug;

              return (
                <ListItemButton
                  key={item.id}
                  component={isDisabled ? 'div' : Link}
                  href={href}
                  disabled={isDisabled}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    transition: 'all 0.15s',
                    bgcolor: isActive ? 'sidebar.activeBg' : 'transparent',
                    color: isActive ? 'text.primary' : 'text.secondary',
                    fontWeight: isActive ? 500 : 400,
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? 'default' : 'pointer',
                    '&:hover': {
                      bgcolor: isDisabled ? 'transparent' : (isActive ? 'sidebar.activeBg' : 'sidebar.hoverBg'),
                      color: isDisabled ? 'text.secondary' : 'text.primary',
                    },
                  }}
                >
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: 20,
                        borderRadius: '0 999px 999px 0',
                        bgcolor: 'sidebar.indicator',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <ListItemIcon sx={{ minWidth: 18, color: 'inherit' }}>
                    <Icon style={{ width: 18, height: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
