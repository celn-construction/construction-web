'use client';

import { CaretDown } from '@phosphor-icons/react';
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
import OrgAvatar from '@/components/ui/OrgAvatar';

export default function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
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
  const otherOrgs = organizations.filter((org) => org.slug !== currentOrgSlug);

  useEffect(() => {
    hideLoading();
  }, [pathname, hideLoading]);

  const handleSwitch = (orgSlug: string) => {
    showLoading('Switching organizations');
    router.push(`/${orgSlug}`);
    setOrgMenuOpen(false);
  };

  const isLoading = orgsLoading;

  if (collapsed) {
    return isLoading ? (
      <Skeleton variant="rectangular" width={34} height={34} sx={{ borderRadius: '8px', flexShrink: 0 }} />
    ) : (
      <OrgAvatar
        name={currentOrg?.name ?? 'Organization'}
        seed={currentOrg?.slug ?? currentOrg?.id ?? 'org'}
        logoUrl={currentOrg?.logoUrl}
      />
    );
  }

  const hasSwitcher = otherOrgs.length > 0;

  const triggerContent = (
    <>
      {isLoading ? (
        <Skeleton variant="rectangular" width={34} height={34} sx={{ borderRadius: '8px', flexShrink: 0 }} />
      ) : (
        <OrgAvatar
          name={currentOrg?.name ?? 'Organization'}
          seed={currentOrg?.slug ?? currentOrg?.id ?? 'org'}
          logoUrl={currentOrg?.logoUrl}
          className="org-avatar"
        />
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
            {currentOrg?.role && (
              <Typography
                sx={{
                  fontSize: '0.625rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  lineHeight: 1,
                  textTransform: 'capitalize',
                }}
              >
                {currentOrg.role}
              </Typography>
            )}
          </>
        )}
      </Box>
      {hasSwitcher && (
        <motion.div
          animate={{ rotate: orgMenuOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="caret-icon"
          style={{ flexShrink: 0 }}
        >
          <CaretDown size={14} weight="bold" />
        </motion.div>
      )}
    </>
  );

  // No other orgs to switch to — non-interactive row (no caret)
  if (!hasSwitcher && !isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.75,
          py: 1.5,
          width: '100%',
          color: 'text.primary',
        }}
      >
        {triggerContent}
      </Box>
    );
  }

  // Has other orgs — dropdown switcher
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
            color: 'text.primary',
            transition: 'background-color 0.15s',
            '& .caret-icon': {
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover': {
              bgcolor: 'action.hover',
              '& .org-avatar': {
                transform: 'scale(1.04)',
              },
              '& .caret-icon': {
                transform: 'translateY(1px)',
              },
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
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
      >
        <Box sx={{ px: 1, py: 0.75, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 500 }}>
            Switch to…
          </Typography>
        </Box>
        {otherOrgs.map((org, index) => (
          <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.slug)}>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
              whileTap={{ scale: 0.97 }}
              style={{ width: '100%' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  width: '100%',
                  '& .item-avatar, & .item-text': {
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:hover .item-avatar': {
                    transform: 'scale(1.06)',
                  },
                  '&:hover .item-text': {
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <OrgAvatar
                  className="item-avatar"
                  name={org.name}
                  seed={org.slug ?? org.id}
                  logoUrl={org.logoUrl}
                  size={32}
                  borderRadius="12px"
                />
                <Box className="item-text" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 400 }}>
                    {org.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', textTransform: 'capitalize' }}>
                    {org.role}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
