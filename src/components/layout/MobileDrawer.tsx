'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Home, LayoutGrid, Zap, Clipboard, FileText, Calendar, Users, GanttChart, BarChart3 } from 'lucide-react';
import { Drawer, Box, IconButton, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { navItems } from './navItems';
import { LogoIcon } from '@/components/ui/Logo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'Calendar': return Calendar;
      case 'GanttChart': return GanttChart;
      case 'BarChart3': return BarChart3;
      case 'FileText': return FileText;
      case 'LayoutGrid': return LayoutGrid;
      case 'Zap': return Zap;
      case 'Clipboard': return Clipboard;
      case 'Users': return Users;
      default: return Home;
    }
  };

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 288,
          bgcolor: 'sidebar.background',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'sidebar.border',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
        <IconButton
          onClick={onClose}
          aria-label="Close menu"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'text.primary',
            },
          }}
        >
          <X style={{ width: 20, height: 20 }} />
        </IconButton>
      </Box>

      {/* Navigation */}
      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
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
            {navItems.slice(0, 5).map((item) => {
              const Icon = getIcon(item.icon);
              const isActive = pathname === item.href;

              return (
                <ListItemButton
                  key={item.id}
                  component={Link}
                  href={item.href}
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
                        width: 4,
                        height: 24,
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
            {navItems.slice(5).map((item) => {
              const Icon = getIcon(item.icon);
              const isActive = pathname === item.href;

              return (
                <ListItemButton
                  key={item.id}
                  component={Link}
                  href={item.href}
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
                        width: 4,
                        height: 24,
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
    </Drawer>
  );
}
