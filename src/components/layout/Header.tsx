'use client';

import { Search, Moon, Sun, ChevronDown, Bell, Plus, Building2, Check, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Box, Typography, IconButton, Divider, Skeleton, Button } from '@mui/material';
import UserMenu from './UserMenu';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/trpc/react';
import { useActiveOrganizationId } from '@/store/useOrganizationStore';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddProjectDialog from '@/components/projects/AddProjectDialog';
import { formatDistanceToNow } from 'date-fns';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { showLoading, hideLoading } = useLoading();

  // Project management
  const params = useParams<{ slug?: string }>();
  const activeOrganizationId = useActiveOrganizationId();
  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery(
    { organizationId: activeOrganizationId ?? undefined },
    { retry: false, enabled: !!activeOrganizationId }
  );

  // Get current project from URL slug
  const currentProject = projects.find(p => p.slug === params?.slug);

  const switchProject = (projectSlug: string) => {
    // Extract current segment from pathname
    const pathParts = pathname.split('/');
    const currentSegment = pathParts.includes('projects') && pathParts.length > 3
      ? pathParts[pathParts.length - 1]
      : 'gantt';

    showLoading('Switching projects');
    router.push(`/projects/${projectSlug}/${currentSegment}`);
    hideLoading();
  };

  // Notification management
  const { data: unreadCount = 0 } = api.notification.unreadCount.useQuery(
    { organizationId: activeOrganizationId ?? '' },
    {
      retry: false,
      enabled: !!activeOrganizationId,
      refetchInterval: 30000,
    }
  );
  const { data: notificationsData } = api.notification.list.useQuery(
    { organizationId: activeOrganizationId ?? '', limit: 20 },
    { retry: false, enabled: notifMenuOpen && !!activeOrganizationId }
  );
  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });
  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: -4 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.default',
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'colors 0.15s',
      }}
    >
      {/* Left: Project Switcher */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {/* Project Switcher */}
        <motion.div variants={item}>
          <DropdownMenu open={projectMenuOpen} onOpenChange={setProjectMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Box
                component="button"
                disabled={projectsLoading}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'divider',
                  },
                  '&:focus-visible': {
                    outline: 'none',
                    ring: 2,
                    ringColor: 'var(--focus-ring)',
                  },
                  '&:disabled': {
                    cursor: 'not-allowed',
                    opacity: 0.5,
                  },
                  transition: 'all 0.15s',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    bgcolor: 'warm.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 style={{ width: 16, height: 16, color: 'white' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled', lineHeight: 1 }}>
                    Project
                  </Typography>
                  {projectsLoading ? (
                    <Skeleton width={96} height={16} />
                  ) : (
                    <Typography sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, lineHeight: 1.2 }}>
                      {projects.length === 0 ? 'No Projects' : (currentProject?.name ?? 'Select Project')}
                    </Typography>
                  )}
                </Box>
                <motion.div animate={{ rotate: projectMenuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronDown style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                </motion.div>
              </Box>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8}>
              <Box sx={{ px: 1, py: 0.75, mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled', fontWeight: 500 }}>
                  Switch Project
                </Typography>
              </Box>
              {projects.map((project) => {
                const isActive = project.slug === params?.slug;
                return (
                  <DropdownMenuItem key={project.id} onClick={() => switchProject(project.slug)}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          bgcolor: isActive ? 'warm.main' : 'action.hover',
                          color: isActive ? 'white' : 'text.secondary',
                        }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 500 : 400 }}>
                          {project.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', textTransform: 'capitalize' }}>
                          {project.status}
                        </Typography>
                      </Box>
                      {isActive && <Check style={{ width: 16, height: 16, color: 'var(--accent-warm)', flexShrink: 0 }} />}
                    </Box>
                  </DropdownMenuItem>
                );
              })}
              {projects.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setAddProjectOpen(true)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      border: '1px dashed',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Plus style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>New Project</Typography>
                </Box>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </motion.div>

      {/* Center: Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'input.background',
            px: 2,
            py: 1,
            borderRadius: 2,
            transition: 'all 0.15s',
            cursor: 'pointer',
            maxWidth: 448,
            width: '100%',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&:hover .search-icon': {
              color: 'text.secondary',
            },
          }}
        >
          <Search className="search-icon" style={{ width: 18, height: 18, color: 'var(--text-muted)', transition: 'color 0.15s' }} />
          <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled', flex: 1 }}>Search...</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              component="kbd"
              sx={{
                px: 0.75,
                py: 0.25,
                fontSize: '0.625rem',
                fontWeight: 500,
                color: 'text.disabled',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.5,
              }}
            >
              ⌘
            </Box>
            <Box
              component="kbd"
              sx={{
                px: 0.75,
                py: 0.25,
                fontSize: '0.625rem',
                fontWeight: 500,
                color: 'text.disabled',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.5,
              }}
            >
              K
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Right: Actions */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {/* Theme Toggle */}
        <motion.div variants={item}>
          <IconButton
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.15 }}
            >
              {theme === 'dark' ? (
                <Sun style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
              ) : (
                <Moon style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
              )}
            </motion.div>
          </IconButton>
        </motion.div>

        {/* Notification Bell */}
        <motion.div variants={item}>
          <DropdownMenu open={notifMenuOpen} onOpenChange={setNotifMenuOpen}>
            <DropdownMenuTrigger asChild>
              <IconButton
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  position: 'relative',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Bell style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
                {unreadCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      minWidth: 16,
                      height: 16,
                      bgcolor: 'error.main',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'white',
                      px: 0.5,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Box>
                )}
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80" style={{ maxHeight: '400px', overflow: 'auto' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600 }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => markAllAsRead.mutate({ organizationId: activeOrganizationId ?? '' })}
                    disabled={markAllAsRead.isPending}
                    sx={{ fontSize: '12px', textTransform: 'none' }}
                  >
                    Mark all read
                  </Button>
                )}
              </Box>
              <Divider />
              {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                <Box>
                  {notificationsData.notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead.mutate({ organizationId: activeOrganizationId ?? '', ids: [notification.id] });
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%', cursor: 'pointer', p: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <UserPlus style={{ width: 16, height: 16, color: 'white' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              bgcolor: 'primary.main',
                              borderRadius: '50%',
                              flexShrink: 0,
                              mt: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </DropdownMenuItem>
                  ))}
                </Box>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No notifications
                  </Typography>
                </Box>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {/* User Menu */}
        <motion.div variants={item}>
          <UserMenu />
        </motion.div>
      </motion.div>

      {/* Add Project Dialog */}
      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </Box>
  );
}
