'use client';

import { useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { Search, Bell, Undo2, UserPlus, Moon, Sun } from 'lucide-react';
import { Box, Typography, IconButton, Divider, Button } from '@mui/material';
import { useThemeStore } from '@/store/useThemeStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Buildings } from '@phosphor-icons/react';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { api } from '@/trpc/react';

const PAGE_TITLES: Record<string, string> = {
  gantt: 'Gantt Chart',
  files: 'File Tree',
  'document-explorer': 'Document Explorer',
  team: 'Team',
};

export default function Header() {
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const pathname = usePathname();

  useNavigationLoading();
  const { activeOrganizationId } = useOrgFromUrl();
  const { theme, toggleTheme } = useThemeStore();
  const params = useParams<{ projectSlug?: string }>();

  const { data: projects = [] } = api.project.list.useQuery(
    { organizationId: activeOrganizationId },
    { retry: false, enabled: !!activeOrganizationId }
  );
  const currentProject = projects.find((p) => p.slug === params.projectSlug);

  const lastSegment = pathname.split('/').pop() ?? '';
  const pageTitle = PAGE_TITLES[lastSegment] ?? null;
  const { unreadCount, notificationsData, markAsRead, markAllAsRead } = useNotifications(
    activeOrganizationId,
    notifMenuOpen
  );

  return (
    <Box
      component="header"
      sx={{
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0,
      }}
    >
      {/* Page Title */}
      {pageTitle && (
        <>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
            {pageTitle}
          </Typography>
          {currentProject && (
            <>
              <Typography sx={{ color: 'text.disabled', fontSize: 16, lineHeight: 1, userSelect: 'none' }}>·</Typography>
              <Buildings size={15} style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
                {currentProject.name}
              </Typography>
            </>
          )}
        </>
      )}

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />
      {/* Dark Search Bar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1,
          bgcolor: 'accent.dark',
          borderRadius: 999,
          px: 2,
          py: 1,
          cursor: 'pointer',
          minWidth: 180,
        }}
      >
        <Search style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.5)' }} />
        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          Search...
        </Typography>
      </Box>

      {/* Undo */}
      <IconButton
        aria-label="Undo"
        sx={{ width: 32, height: 32, borderRadius: 1, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Undo2 style={{ width: 18, height: 18, color: 'inherit' }} />
      </IconButton>

      {/* Notifications Bell */}
      <DropdownMenu open={notifMenuOpen} onOpenChange={setNotifMenuOpen}>
        <DropdownMenuTrigger asChild>
          <IconButton
            aria-label="Notifications"
            sx={{ width: 32, height: 32, borderRadius: 1, position: 'relative', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Bell style={{ width: 18, height: 18, color: 'inherit' }} />
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 14,
                  height: 14,
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'white',
                  px: 0.25,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Box>
            )}
          </IconButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80" style={{ maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={() => markAllAsRead.mutate({ organizationId: activeOrganizationId })}
                disabled={markAllAsRead.isPending}
                sx={{ fontSize: 12, textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
          {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
            notificationsData.notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => {
                  if (!n.read) markAsRead.mutate({ organizationId: activeOrganizationId, ids: [n.id] });
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%', p: 1.5 }}>
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
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>{n.message}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  {!n.read && (
                    <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', flexShrink: 0, mt: 0.5 }} />
                  )}
                </Box>
              </DropdownMenuItem>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No notifications</Typography>
            </Box>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <IconButton
        aria-label="Toggle theme"
        onClick={toggleTheme}
        sx={{ width: 32, height: 32, borderRadius: 1, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
      >
        {theme === 'dark' ? (
          <Sun style={{ width: 18, height: 18, color: 'inherit' }} />
        ) : (
          <Moon style={{ width: 18, height: 18, color: 'inherit' }} />
        )}
      </IconButton>
    </Box>
  );
}
