'use client';

import { ChevronDown, Building2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Skeleton } from '@mui/material';
import { api } from '@/trpc/react';
import { useClearProject } from '@/store/hooks';
import { useLoading } from '@/components/providers/LoadingProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OrgSwitcher() {
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const utils = api.useUtils();
  const clearProject = useClearProject();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const { data: organizations = [], isLoading: orgsLoading } = api.organization.list.useQuery(
    undefined,
    { retry: false }
  );

  const { data: currentOrg, isLoading: currentOrgLoading } = api.organization.getCurrent.useQuery(
    undefined,
    { retry: false }
  );

  const switchOrganizationMutation = api.organization.switchOrganization.useMutation({
    onSuccess: () => {
      // Clear current project in Zustand
      clearProject();
      // Invalidate all org-scoped queries
      void utils.organization.getCurrent.invalidate();
      void utils.project.list.invalidate();
      void utils.member.list.invalidate();
      void utils.invitation.list.invalidate();
      // Navigate to projects which will show all projects in the new org
      router.push('/projects');
      hideLoading();
    },
    onError: () => {
      hideLoading();
    },
  });

  const handleSwitch = (orgId: string) => {
    showLoading('Switching projects');
    switchOrganizationMutation.mutate({ organizationId: orgId });
  };

  const isLoading = orgsLoading || currentOrgLoading;

  // Single org: static text (no dropdown)
  if (organizations.length <= 1) {
    return (
      <Box sx={{ px: 2, py: 1.5 }}>
        {isLoading ? (
          <Skeleton width={120} height={20} />
        ) : (
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {currentOrg?.name ?? 'No Organization'}
          </Typography>
        )}
      </Box>
    );
  }

  // Multiple orgs: dropdown switcher
  return (
    <Box sx={{ px: 1, pb: 1 }}>
      <DropdownMenu open={orgMenuOpen} onOpenChange={setOrgMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Box
            component="button"
            disabled={isLoading || switchOrganizationMutation.isPending}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              width: '100%',
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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled', lineHeight: 1 }}>
                Organization
              </Typography>
              {isLoading ? (
                <Skeleton width={96} height={16} />
              ) : (
                <Typography sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, lineHeight: 1.2 }}>
                  {currentOrg?.name ?? 'Select Organization'}
                </Typography>
              )}
            </Box>
            <motion.div animate={{ rotate: orgMenuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
            </motion.div>
          </Box>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8}>
          <Box sx={{ px: 1, py: 0.75, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled', fontWeight: 500 }}>
              Switch Organization
            </Typography>
          </Box>
          {organizations.map((org) => {
            const isActive = org.id === currentOrg?.id;
            return (
              <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.id)}>
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
                    {org.name.charAt(0).toUpperCase()}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 500 : 400 }}>
                      {org.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', textTransform: 'capitalize' }}>
                      {org.role}
                    </Typography>
                  </Box>
                  {isActive && <Check style={{ width: 16, height: 16, color: 'var(--accent-warm)', flexShrink: 0 }} />}
                </Box>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
