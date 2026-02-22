'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { X, BarChart2, Folder, Users, FileSearch, ChevronsUpDown, Building2, type LucideIcon } from 'lucide-react';
import { Drawer, Box, IconButton, Typography, List, ListItemButton, ListItemIcon, ListItemText, Skeleton } from '@mui/material';
import { projectNavItems, getProjectNavHref } from './navItems';
import OrgSwitcher from './OrgSwitcher';
import { api } from '@/trpc/react';
import { authClient } from '@/lib/auth-client';

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Active';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

const iconMap: Record<string, LucideIcon> = {
  BarChart2,
  Folder,
  FileSearch,
  Users,
};

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const params = useParams<{ orgSlug?: string; projectSlug?: string }>();
  const { orgSlug, projectSlug } = params;

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { data: organizations = [] } = api.organization.list.useQuery(undefined, { retry: false });
  const currentOrg = organizations.find((o) => o.slug === orgSlug);

  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery(
    { organizationId: currentOrg?.id ?? '' },
    { enabled: !!currentOrg?.id, retry: false }
  );
  const currentProject = projects.find((p) => p.slug === projectSlug);

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
          borderRight: '1px solid',
          borderColor: 'sidebar.border',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Org Header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {/* Top bar with close button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 1.5,
            pt: 1,
          }}
        >
          <IconButton
            onClick={onClose}
            aria-label="Close menu"
            size="small"
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <X style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>

        {/* Org Selector */}
        <OrgSwitcher />

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'divider' }} />

        {/* Project Switcher */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.75,
            py: 1,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.25,
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 style={{ width: 14, height: 14, color: 'currentColor' }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '2px' }}>
            {projectsLoading ? (
              <>
                <Skeleton width={100} height={13} />
                <Skeleton width={60} height={10} />
              </>
            ) : projectSlug && currentProject ? (
              <>
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {currentProject.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    lineHeight: 1,
                    textTransform: 'capitalize',
                  }}
                >
                  {formatStatus(currentProject.status)}
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled', lineHeight: 1.2 }}>
                No project selected
              </Typography>
            )}
          </Box>

          <ChevronsUpDown style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.4 }} />
        </Box>
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
            const Icon = iconMap[item.icon] ?? BarChart2;
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
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.15s',
                  border: '1px solid',
                  borderColor: isActive ? 'divider' : 'transparent',
                  bgcolor: isActive ? 'sidebar.activeItemBg' : 'transparent',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'default' : 'pointer',
                  '&:hover': {
                    bgcolor: isDisabled ? 'transparent' : (isActive ? 'sidebar.activeItemBg' : 'sidebar.hoverBg'),
                    color: isDisabled ? 'text.secondary' : 'text.primary',
                    borderColor: isActive ? 'divider' : 'transparent',
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
                      height: 18,
                      borderRadius: '0 2px 2px 0',
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
            color: 'text.primary',
          }}
        >
          {getInitials(user?.name)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '2px' }}>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 500,
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
              fontSize: '0.625rem',
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {user?.email ?? ''}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
