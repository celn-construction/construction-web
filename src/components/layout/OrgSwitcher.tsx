'use client';

import { ChevronsUpDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Box, Typography, Skeleton } from '@mui/material';
import { api } from '@/trpc/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLoading } from '@/components/providers/LoadingProvider';

function OrgAvatar({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '9px',
        background: 'linear-gradient(180deg, #FF8400 0%, #CC6A00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#ffffff',
        fontSize: '0.6875rem',
        fontWeight: 600,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Box>
  );
}

export default function OrgSwitcher() {
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const router = useRouter();
  const params = useParams<{ orgSlug?: string }>();
  const pathname = usePathname();
  const { showLoading, hideLoading } = useLoading();
  const currentOrgSlug = params.orgSlug;

  const { data: organizations = [], isLoading: orgsLoading } = api.organization.list.useQuery(
    undefined,
    { retry: false }
  );

  const currentOrg = organizations.find((org) => org.slug === currentOrgSlug);

  useEffect(() => {
    hideLoading();
  }, [pathname, hideLoading]);

  const handleSwitch = (orgSlug: string) => {
    showLoading('Switching organizations');
    router.push(`/${orgSlug}`);
    setOrgMenuOpen(false);
  };

  const isLoading = orgsLoading;

  const triggerContent = (
    <>
      {isLoading ? (
        <Skeleton variant="rectangular" width={34} height={34} sx={{ borderRadius: '9px', flexShrink: 0 }} />
      ) : (
        <OrgAvatar name={currentOrg?.name ?? 'O'} />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1, gap: '2px' }}>
        {isLoading ? (
          <>
            <Skeleton width={100} height={14} />
            <Skeleton width={60} height={10} />
          </>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 130,
                lineHeight: 1.2,
              }}
            >
              {currentOrg?.name ?? 'No Organization'}
            </Typography>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
              Pro Plan
            </Typography>
          </>
        )}
      </Box>
      <motion.div
        animate={{ rotate: orgMenuOpen ? 180 : 0 }}
        transition={{ duration: 0.15 }}
        style={{ flexShrink: 0 }}
      >
        <ChevronsUpDown style={{ width: 16, height: 16, color: 'currentColor' }} />
      </motion.div>
    </>
  );

  // Single org — show as non-interactive row (same layout, no dropdown)
  if (organizations.length <= 1 && !isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.75,
          py: 1.5,
          width: '100%',
          color: 'text.disabled',
        }}
      >
        {triggerContent}
      </Box>
    );
  }

  // Multiple orgs — dropdown switcher
  return (
    <DropdownMenu open={orgMenuOpen} onOpenChange={setOrgMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Box
          component="button"
          disabled={isLoading}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.75,
            py: 1.5,
            width: '100%',
            bgcolor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'text.disabled',
            transition: 'background-color 0.15s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&:disabled': {
              cursor: 'not-allowed',
              opacity: 0.5,
            },
          }}
        >
          {triggerContent}
        </Box>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        <Box sx={{ px: 1, py: 0.75, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled', fontWeight: 500 }}>
            Switch Organization
          </Typography>
        </Box>
        {organizations.map((org) => {
          const isActive = org.slug === currentOrgSlug;
          return (
            <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.slug)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
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
                    background: isActive
                      ? 'linear-gradient(180deg, #FF8400 0%, #CC6A00 100%)'
                      : undefined,
                    bgcolor: isActive ? undefined : 'action.hover',
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
                {isActive && <Check style={{ width: 16, height: 16, color: '#FF8400', flexShrink: 0 }} />}
              </Box>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
