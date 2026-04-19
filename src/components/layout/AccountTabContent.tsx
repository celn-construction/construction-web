'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { IBeamLoader } from '@/components/ui/IBeamLoader';
import { Plus, Crown, CaretRight, ArrowLeft } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { formatRole } from '@/lib/utils/formatting';
import { canManageOrganization } from '@/lib/permissions';
import OrgAvatar from '@/components/ui/OrgAvatar';
import OrgDetailsForm from '@/components/organization/OrgDetailsForm';

interface AccountTabContentProps {
  onCloseModal: () => void;
}

export default function AccountTabContent({ onCloseModal }: AccountTabContentProps) {
  const router = useRouter();
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);

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
        <IBeamLoader size={28} />
      </Box>
    );
  }

  if (editingOrgId) {
    const editingOrg = organizations.find((o) => o.id === editingOrgId);
    const canEdit = editingOrg ? canManageOrganization(editingOrg.role) : false;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          component="button"
          onClick={() => setEditingOrgId(null)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            alignSelf: 'flex-start',
            px: 0.5,
            py: 0.25,
            bgcolor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: '6px',
            transition: 'color 0.15s',
            '&:hover': { color: 'text.primary' },
          }}
        >
          <ArrowLeft size={13} weight="bold" />
          Back to teams
        </Box>
        <OrgDetailsForm organizationId={editingOrgId} canEdit={canEdit} />
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
        {organizations.map((org) => {
          const canEdit = canManageOrganization(org.role);

          const rowContent = (
            <>
              <OrgAvatar
                name={org.name}
                seed={org.slug ?? org.id}
                logoUrl={org.logoUrl}
                size={36}
                borderRadius="10px"
              />
              <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
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
              {canEdit && (
                <CaretRight
                  className="row-chevron"
                  size={14}
                  weight="bold"
                  style={{ color: 'var(--mui-palette-text-disabled)', flexShrink: 0 }}
                />
              )}
            </>
          );

          if (canEdit) {
            return (
              <Box
                key={org.id}
                component="button"
                onClick={() => setEditingOrgId(org.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                  width: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  '& .row-chevron': {
                    transition: 'transform 0.15s',
                  },
                  '&:hover': {
                    bgcolor: 'action.selected',
                    '& .row-chevron': {
                      transform: 'translateX(2px)',
                    },
                  },
                }}
              >
                {rowContent}
              </Box>
            );
          }

          return (
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
              {rowContent}
            </Box>
          );
        })}
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
