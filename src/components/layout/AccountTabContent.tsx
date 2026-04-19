'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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

const EASE = [0.4, 0, 0.2, 1] as const;

const listViewVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.18, ease: 'easeOut', when: 'beforeChildren' },
  },
  exit: { opacity: 0, x: -6, transition: { duration: 0.12 } },
};

const drillViewVariants: Variants = {
  hidden: { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } },
  exit: { opacity: 0, x: 4, transition: { duration: 0.12 } },
};

const listStaggerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

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

  const editingOrg = editingOrgId
    ? organizations.find((o) => o.id === editingOrgId)
    : null;
  const drillCanEdit = editingOrg ? canManageOrganization(editingOrg.role) : false;

  return (
    <AnimatePresence mode="wait">
      {editingOrgId ? (
        <motion.div
          key="drill"
          variants={drillViewVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
                transition: 'color 0.15s, transform 0.15s',
                '& .back-arrow': {
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '&:hover': {
                  color: 'text.primary',
                  '& .back-arrow': { transform: 'translateX(-2px)' },
                },
                '&:active': { transform: 'scale(0.985)' },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Box component="span" className="back-arrow" sx={{ display: 'inline-flex' }}>
                <ArrowLeft size={13} weight="bold" />
              </Box>
              Back to teams
            </Box>
            <OrgDetailsForm organizationId={editingOrgId} canEdit={drillCanEdit} />
          </Box>
        </motion.div>
      ) : (
        <motion.div
          key="list"
          variants={listViewVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
            <Box
              component={motion.div}
              variants={listStaggerVariants}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {organizations.map((org) => {
                const canEdit = canManageOrganization(org.role);
                const isOwner = org.role === 'owner';

                const rolePill = (
                  <Box
                    sx={(theme) => ({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.375,
                      mt: 0.5,
                      px: 0.875,
                      py: 0.25,
                      borderRadius: '999px',
                      bgcolor: isOwner
                        ? alpha(theme.palette.warning.main, 0.18)
                        : alpha(theme.palette.text.primary, 0.08),
                      color: isOwner ? theme.palette.warning.dark : theme.palette.text.secondary,
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '0.01em',
                    })}
                  >
                    {isOwner && <Crown size={9} weight="fill" />}
                    {formatRole(org.role)}
                  </Box>
                );

                const rowContent = (
                  <>
                    <OrgAvatar
                      className="row-avatar"
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
                      {rolePill}
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
                      component={motion.div}
                      variants={rowVariants}
                      sx={{ width: '100%' }}
                    >
                      <Box
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
                          transition: 'background-color 0.15s, transform 0.15s',
                          '& .row-chevron': {
                            opacity: 0.4,
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                          },
                          '& .row-avatar': {
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          },
                          '&:hover': {
                            bgcolor: 'action.selected',
                            '& .row-avatar': { transform: 'scale(1.04)' },
                            '& .row-chevron': {
                              transform: 'translateX(3px)',
                              opacity: 1,
                            },
                          },
                          '&:active': { transform: 'scale(0.985)' },
                          '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 2,
                          },
                        }}
                      >
                        {rowContent}
                      </Box>
                    </Box>
                  );
                }

                return (
                  <Box
                    key={org.id}
                    component={motion.div}
                    variants={rowVariants}
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
                '&:active': { transform: 'scale(0.985)' },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
