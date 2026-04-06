'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import { Plus, Crown, Buildings } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { formatRole } from '@/lib/utils/formatting';

interface AccountTabContentProps {
  onCloseModal: () => void;
}

export default function AccountTabContent({ onCloseModal }: AccountTabContentProps) {
  const router = useRouter();
  const { data: organizations = [], isLoading } = api.organization.list.useQuery(
    undefined,
    { retry: false },
  );

  const handleCreateTeam = () => {
    onCloseModal();
    router.push('/onboarding?new=true');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Section header */}
      <Box>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3 }}>
          Your Teams
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.4, mt: 0.5 }}>
          Teams you belong to across all organizations.
        </Typography>
      </Box>

      {/* Org list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {organizations.map((org) => (
          <Box
            key={org.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1.25,
              borderRadius: '8px',
              bgcolor: 'action.hover',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.accent.dark}, ${theme.palette.accent.gradientEnd})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'common.white',
              }}
            >
              {org.name.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {org.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                {org.role === 'owner' && (
                  <Crown size={10} weight="fill" style={{ color: 'inherit' }} />
                )}
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    color: 'text.disabled',
                    lineHeight: 1,
                  }}
                >
                  {formatRole(org.role)}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Create new team */}
      <Box
        component="button"
        onClick={handleCreateTeam}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.25,
          borderRadius: '8px',
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'text.disabled',
          },
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Plus size={16} weight="bold" />
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            Create New Team
          </Typography>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: 'text.disabled',
              lineHeight: 1,
              mt: 0.25,
            }}
          >
            Set up a new construction company
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
