'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, LayoutGrid, Zap, Clipboard, GanttChart, FileText, Calendar, Users, BarChart3 } from 'lucide-react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { navItems, getNavHref } from './navItems';
import { LogoIcon } from '@/components/ui/Logo';
import OrgSwitcher from './OrgSwitcher';

interface SidebarProps {
  projectSlug?: string;
}

export default function Sidebar({ projectSlug }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? projectSlug;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'Calendar': return Calendar;
      case 'FileText': return FileText;
      case 'LayoutGrid': return LayoutGrid;
      case 'Zap': return Zap;
      case 'Clipboard': return Clipboard;
      case 'GanttChart': return GanttChart;
      case 'BarChart3': return BarChart3;
      case 'Users': return Users;
      default: return Home;
    }
  };

  const navigateItems = navItems.slice(0, 5);
  const workspaceItems = navItems.slice(5);

  return (
    <Box
      component="aside"
      sx={{
        height: '100vh',
        width: 208, // w-52
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
        {/* Navigate Section */}
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
            Navigate
          </Typography>
          <List sx={{ p: 0 }}>
            {navigateItems.map((item) => {
              const Icon = getIcon(item.icon);
              const href = getNavHref(item.segment, slug);
              const isActive = pathname.startsWith(href);

              return (
                <ListItemButton
                  key={item.id}
                  component={Link}
                  href={href}
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
                    '&:hover': {
                      bgcolor: isActive ? 'sidebar.activeBg' : 'sidebar.hoverBg',
                      color: 'text.primary',
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

        {/* Workspace Section */}
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
            Workspace
          </Typography>
          <List sx={{ p: 0 }}>
            {workspaceItems.map((item) => {
              const Icon = getIcon(item.icon);
              const href = getNavHref(item.segment, slug);
              const isActive = pathname.startsWith(href);

              return (
                <ListItemButton
                  key={item.id}
                  component={Link}
                  href={href}
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
                    '&:hover': {
                      bgcolor: isActive ? 'sidebar.activeBg' : 'sidebar.hoverBg',
                      color: 'text.primary',
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
