'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, User, Settings, CreditCard, LifeBuoy, LogOut } from 'lucide-react';
import { ChartBar, FolderSimple, FileMagnifyingGlass, GearSix, type Icon } from '@phosphor-icons/react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { projectNavItems, getProjectNavHref } from './navItems';
import OrgSwitcher from './OrgSwitcher';
import ProjectSwitcher from './ProjectSwitcher';
import { authClient, signOut } from '@/lib/auth-client';
import { getInitials } from '@/lib/utils/formatting';
import LoadingSpinner from '@/components/ui/loading-spinner';
import AccountSettingsModal from './AccountSettingsModal';

const iconMap: Record<string, Icon> = {
  ChartBar,
  FolderSimple,
  FileMagnifyingGlass,
  GearSix,
};

const profileMenuItems = [
  { icon: User, label: 'My Profile' },
  { icon: Settings, label: 'Account Settings' },
  { icon: CreditCard, label: 'Billing' },
  { icon: LifeBuoy, label: 'Help & Support' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const { orgSlug, projectSlug } = params;
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

            return (
              <ListItemButton
                key={item.id}
                component={Link}
                href={href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  transition: 'all 0.15s',
                  border: '1px solid',
                  borderColor: isActive ? 'sidebar.border' : 'transparent',
                  bgcolor: isActive ? 'sidebar.activeItemBg' : 'transparent',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'sidebar.activeItemBg' : 'sidebar.hoverBg',
                    color: 'text.primary',
                    borderColor: isActive ? 'sidebar.border' : 'transparent',
                  },
                  '&.MuiListItemButton-root:hover': {
                    bgcolor: isActive ? 'sidebar.activeItemBg' : 'sidebar.hoverBg',
                  },
                }}
              >
                {isActive && (
                  <Box
                    sx={{ width: 3, height: 18, borderRadius: '2px', bgcolor: 'sidebar.indicator', flexShrink: 0 }}
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

      {/* User Row with Profile Dropdown */}
      <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
        <DropdownMenuTrigger asChild>
          <Box
            component="button"
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.75,
              py: 1.5,
              width: '100%',
              bgcolor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'text.secondary',
              transition: 'background-color 0.15s',
              '&:hover': { bgcolor: 'action.hover' },
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
                color: 'text.primary',
              }}
            >
              {getInitials(user?.name)}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '1px' }}>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
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
                  color: 'text.secondary',
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

            <ChevronsUpDown style={{ width: 14, height: 14, flexShrink: 0, color: 'inherit' }} />
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', p: '14px' }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '999px',
                bgcolor: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.primary',
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

          {/* Divider */}
          <Box sx={{ height: '1px', bgcolor: 'divider' }} />

          {/* Menu Items */}
          <Box sx={{ py: '4px', px: '6px' }}>
            {profileMenuItems.map((item) => (
              <Box
                key={item.label}
                component="button"
                onClick={() => {
                  setProfileOpen(false);
                  if (item.label === 'Account Settings') {
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
                <item.icon style={{ width: 14, height: 14, color: 'inherit' }} />
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.primary' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Divider */}
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
            <LogOut style={{ width: 14, height: 14, color: 'inherit' }} />
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
