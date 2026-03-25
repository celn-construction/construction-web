'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { keyframes } from '@mui/system';
import { Bell, UserPlus } from 'lucide-react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { useProjectSwitcher } from '@/hooks/useProjectSwitcher';
import ProjectSwitcher from './ProjectSwitcher';

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
  const { activeOrganizationId, orgSlug } = useOrgFromUrl();
  const { currentProject } = useProjectSwitcher(activeOrganizationId, orgSlug);

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
          <Typography sx={{ color: 'text.disabled', fontSize: 16, lineHeight: 1, userSelect: 'none' }}>·</Typography>
          <ProjectSwitcher />
          {currentProject && currentProject.completionPercent != null && (() => {
            const pct = currentProject.completionPercent;
            const fillColor =
              pct >= 100 ? 'status.completed' :
              pct >= 60  ? 'status.active' :
              pct >= 30  ? 'status.inProgress' :
                           'text.disabled';
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  ml: 0.75,
                  px: 1,
                  py: 0.5,
                  borderRadius: 'var(--radius-pill)',
                  bgcolor: 'action.hover',
                }}
              >
                <Box sx={{ width: 64, height: 5, borderRadius: 'var(--radius-pill)', bgcolor: 'divider', overflow: 'hidden', flexShrink: 0 }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 'var(--radius-pill)',
                      bgcolor: fillColor,
                      animation: `${keyframes`from { width: 0% } to { width: ${pct}% }`} 0.6s ease-out`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: fillColor,
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {pct}%
                </Typography>
                {currentProject.taskCount != null && currentProject.taskCount > 0 && (
                  <Typography
                    sx={{
                      fontSize: '0.625rem',
                      fontWeight: 500,
                      color: 'text.secondary',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    · {currentProject.completedTaskCount ?? 0}/{currentProject.taskCount} tasks
                  </Typography>
                )}
                {(() => {
                  if (!currentProject.endDate) {
                    return (
                      <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.disabled', lineHeight: 1, whiteSpace: 'nowrap' }}>
                        · No end date
                      </Typography>
                    );
                  }
                  const daysLeft = differenceInCalendarDays(new Date(currentProject.endDate), new Date());
                  const label = daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)} days overdue`;
                  const color = daysLeft > 0 ? 'text.secondary' : daysLeft === 0 ? 'status.inProgress' : 'error.main';
                  return (
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color, lineHeight: 1, whiteSpace: 'nowrap' }}>
                      · {label}
                    </Typography>
                  );
                })()}
              </Box>
            );
          })()}
        </>
      )}

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />
      {/* Notifications Bell */}
      <DropdownMenu open={notifMenuOpen} onOpenChange={setNotifMenuOpen}>
        <DropdownMenuTrigger asChild>
          <IconButton
            aria-label="Notifications"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              position: 'relative',
              color: 'text.secondary',
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'divider' },
            }}
          >
            <Bell style={{ width: 18, height: 18, color: 'inherit' }} />
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'white',
                  px: 0.375,
                  lineHeight: 1,
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
                variant="text"
                size="small"
                onClick={() => markAllAsRead.mutate({ organizationId: activeOrganizationId })}
                loading={markAllAsRead.isPending}
                loadingPosition="start"
                sx={{ fontSize: 12 }}
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

    </Box>
  );
}
