'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { User, ChartBar, FolderSimple, FileMagnifyingGlass, GearSix, CaretRight, CaretLineLeft, CaretLineRight, CreditCard, Lifebuoy, SignOut, type Icon } from '@phosphor-icons/react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { projectNavItems, getProjectNavHref } from './navItems';
import OrgSwitcher from './OrgSwitcher';

import { authClient, signOut } from '@/lib/auth-client';
import { getInitials } from '@/lib/utils/formatting';
import LoadingSpinner from '@/components/ui/loading-spinner';
import AccountSettingsModal from './AccountSettingsModal';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

const iconMap: Record<string, Icon> = {
  ChartBar,
  FolderSimple,
  FileMagnifyingGlass,
  GearSix,
};

const profileMenuItems = [
  { icon: User, label: 'My Profile' },
  { icon: GearSix, label: 'Account Settings' },
  { icon: CreditCard, label: 'Billing' },
  { icon: Lifebuoy, label: 'Help & Support' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const { orgSlug, projectSlug } = params;
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac/.test(navigator.userAgent));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            setProfileOpen(false);
            router.push('/sign-in');
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Box
      component="aside"
      sx={{
        height: '100vh',
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        bgcolor: 'sidebar.background',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease, background-color 0.2s ease',
        borderRight: '1px solid',
        borderColor: 'sidebar.border',
        overflow: 'hidden',
      }}
    >
      {/* Org Header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {collapsed ? (
          <Tooltip title="Expand sidebar" placement="right">
            <Box
              component="button"
              onClick={onToggleCollapse}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                py: 1.5,
                px: 1,
                bgcolor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'sidebar.hoverBg' },
              }}
            >
              <OrgSwitcher collapsed />
            </Box>
          </Tooltip>
        ) : (
          <OrgSwitcher />
        )}
      </Box>

      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: 2,
          px: collapsed ? 0.75 : 1.5,
          overflow: 'hidden',
          transition: 'padding 0.2s ease',
        }}
      >
        {/* Section Label */}
        {!collapsed && (
          <Typography
            sx={{
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: 'text.disabled',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              px: 1,
              pb: 1,
              userSelect: 'none',
            }}
          >
            Navigation
          </Typography>
        )}

        {/* Nav Items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {projectNavItems.map((item) => {
            const NavIcon = iconMap[item.icon] ?? ChartBar;
            const href = getProjectNavHref(item.segment, orgSlug, projectSlug);
            const isActive = !!(projectSlug && pathname.includes(`/projects/${projectSlug}/${item.segment}`));
            const isDisabled = !projectSlug;

            const content = (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 1.25,
                  px: collapsed ? 0 : 1.25,
                  py: 0.875,
                  borderRadius: '8px',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  bgcolor: isActive ? 'sidebar.activeItemBg' : 'transparent',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  opacity: isDisabled ? 0.35 : 1,
                  cursor: isDisabled ? 'default' : 'pointer',
                  overflow: 'hidden',
                  '&:hover': isDisabled ? {} : {
                    bgcolor: isActive ? 'sidebar.activeItemBg' : 'sidebar.hoverBg',
                    color: 'text.primary',
                  },
                }}
              >
                {/* Active Indicator — thin left accent */}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '2.5px',
                      height: 16,
                      borderRadius: '0 2px 2px 0',
                      bgcolor: 'sidebar.indicator',
                    }}
                    aria-hidden="true"
                  />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                  <NavIcon size={17} weight={isActive ? 'fill' : 'regular'} />
                </Box>

                {!collapsed && (
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 550 : 400,
                      letterSpacing: isActive ? '-0.005em' : '0',
                      lineHeight: 1,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Typography>
                )}

                {/* Subtle arrow for active item */}
                {isActive && !collapsed && (
                  <CaretRight style={{ width: 13, height: 13, opacity: 0.4, flexShrink: 0 }} />
                )}
              </Box>
            );

            const wrappedContent = collapsed ? (
              <Tooltip title={item.label} placement="right" key={item.id}>
                {isDisabled ? (
                  <Box>{content}</Box>
                ) : (
                  <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {content}
                  </Link>
                )}
              </Tooltip>
            ) : isDisabled ? (
              <Box key={item.id}>{content}</Box>
            ) : (
              <Link
                key={item.id}
                href={href}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {content}
              </Link>
            );

            return wrappedContent;
          })}
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Collapse Toggle */}
        <Box sx={{ pb: 1 }}>
          <Tooltip title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (${isMac ? '\u2318' : 'Ctrl+'}B)`} placement="right">
            <Box
              component="button"
              onClick={onToggleCollapse}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 1.25,
                px: collapsed ? 0 : 1.25,
                py: 0.875,
                width: '100%',
                borderRadius: '8px',
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: 'text.disabled',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: 'sidebar.hoverBg',
                  color: 'text.secondary',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                {collapsed ? (
                  <CaretLineRight size={15} weight="bold" />
                ) : (
                  <CaretLineLeft size={15} weight="bold" />
                )}
              </Box>
              {!collapsed && (
                <>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 400,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    Collapse
                  </Typography>
                  <Box
                    component="kbd"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      lineHeight: 1,
                      color: 'text.secondary',
                      bgcolor: 'background.paper',
                      px: 0.75,
                      py: 0.5,
                      borderRadius: '5px',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 1px 0 0 rgba(0,0,0,0.08)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {isMac ? '\u2318' : 'Ctrl+'}<Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1 }}>B</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {/* User Profile */}
      <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
        <DropdownMenuTrigger asChild>
          <Box
            component="button"
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 1.25,
              px: collapsed ? 0 : 1.75,
              py: 1.5,
              width: '100%',
              bgcolor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'text.secondary',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'sidebar.hoverBg',
              },
            }}
          >
            {/* Avatar with gradient */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.accent.dark}, ${theme.palette.accent.gradientEnd})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'common.white',
                letterSpacing: '0.02em',
              }}
            >
              {getInitials(user?.name)}
            </Box>

            {!collapsed && (
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '2px' }}>
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 550,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    textAlign: 'left',
                  }}
                >
                  {user?.name ?? 'User'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    color: 'text.disabled',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    textAlign: 'left',
                  }}
                >
                  {user?.email ?? ''}
                </Typography>
              </Box>
            )}
          </Box>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          style={{ width: 240, padding: 0, overflow: 'hidden', borderRadius: 12 }}
        >
          {/* Profile Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: '14px' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.accent.dark}, ${theme.palette.accent.gradientEnd})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'common.white',
              }}
            >
              {getInitials(user?.name)}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'text.primary',
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
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  mt: '2px',
                }}
              >
                {user?.email ?? ''}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: '1px', bgcolor: 'divider' }} />

          {/* Menu Items */}
          <Box sx={{ py: '4px', px: '6px' }}>
            {profileMenuItems.map((item) => (
              <Box
                key={item.label}
                component="button"
                onClick={() => {
                  setProfileOpen(false);
                  if (item.label === 'Account Settings' || item.label === 'My Profile') {
                    setSettingsOpen(true);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  px: '10px',
                  py: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <item.icon size={14} />
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.primary' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ height: '1px', bgcolor: 'divider' }} />

          {/* Log Out */}
          <Box
            component="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              px: '14px',
              py: '10px',
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              color: 'error.main',
              transition: 'background-color 0.15s',
              '&:hover': { bgcolor: 'action.hover' },
              '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
            }}
          >
            <SignOut size={14} />
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'inherit' }}>
              Log out
            </Typography>
          </Box>
        </DropdownMenuContent>
      </DropdownMenu>

      {isLoggingOut && <LoadingSpinner size="lg" fullScreen text="Logging out..." />}

      <AccountSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Box>
  );
}
