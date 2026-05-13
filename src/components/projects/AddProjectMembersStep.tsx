'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowRight,
  MagnifyingGlass,
  Check,
  Info,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import type { AssignableRole } from '@/lib/validations/invitation';

interface AddProjectMembersStepProps {
  projectId: string;
  projectName: string;
  organizationId: string;
  currentUserId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const ROLE_OPTIONS: Array<{ value: AssignableRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?';
  }
  return email?.slice(0, 2).toUpperCase() ?? '?';
}

export default function AddProjectMembersStep({
  projectId,
  projectName,
  organizationId,
  currentUserId,
  onComplete,
  onSkip,
}: AddProjectMembersStepProps) {
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const utils = api.useUtils();

  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Map<string, AssignableRole>>(
    new Map()
  );

  const { data: members = [], isLoading } = api.member.list.useQuery({
    organizationId,
  });

  const otherMembers = useMemo(
    () => members.filter((m) => m.user.id !== currentUserId),
    [members, currentUserId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return otherMembers;
    return otherMembers.filter((m) => {
      const name = m.user.name?.toLowerCase() ?? '';
      const email = m.user.email?.toLowerCase() ?? '';
      return name.includes(q) || email.includes(q);
    });
  }, [otherMembers, search]);

  const toggleMember = (userId: string) => {
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.set(userId, 'member');
      }
      return next;
    });
  };

  const setRole = (userId: string, role: AssignableRole) => {
    setSelections((prev) => {
      if (!prev.has(userId)) return prev;
      const next = new Map(prev);
      next.set(userId, role);
      return next;
    });
  };

  const bulkAdd = api.projectMember.bulkAdd.useMutation({
    onSuccess: ({ added }) => {
      void utils.projectMember.list.invalidate({ projectId });
      showSnackbar(
        added === 1
          ? '1 teammate added to project'
          : `${added} teammates added to project`,
        'success'
      );
      onComplete();
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to add teammates', 'error');
    },
  });

  const handleAdd = () => {
    const memberPayload = Array.from(selections.entries()).map(
      ([userId, role]) => ({ userId, role })
    );
    bulkAdd.mutate({ projectId, members: memberPayload });
  };

  const selectedCount = selections.size;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography
          sx={{
            fontSize: '1.0625rem',
            fontWeight: 600,
            letterSpacing: '-0.005em',
            color: 'text.primary',
          }}
        >
          Add your team
        </Typography>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: 'text.secondary',
            mt: 0.5,
            lineHeight: 1.45,
          }}
        >
          Pick people from your organization to add to{' '}
          <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {projectName}
          </Box>
          .
        </Typography>
      </Box>

      <TextField
        placeholder="Search teammates by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <MagnifyingGlass
              size={16}
              style={{ marginRight: 8, opacity: 0.55, flexShrink: 0 }}
            />
          ),
        }}
      />

      <Box
        sx={{
          maxHeight: 280,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          mx: -0.5,
        }}
      >
        {isLoading ? (
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: 'text.secondary',
              textAlign: 'center',
              py: 3,
            }}
          >
            Loading teammates…
          </Typography>
        ) : filtered.length === 0 ? (
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: 'text.secondary',
              textAlign: 'center',
              py: 3,
            }}
          >
            {search
              ? 'No teammates match your search'
              : 'No other teammates in your organization yet'}
          </Typography>
        ) : (
          filtered.map((m) => {
            const isSelected = selections.has(m.user.id);
            const role = selections.get(m.user.id) ?? 'member';
            return (
              <Box
                key={m.user.id}
                onClick={() => toggleMember(m.user.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMember(m.user.id);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.25,
                  py: 1,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, 0.06)
                    : 'transparent',
                  '&:hover': {
                    bgcolor: isSelected
                      ? alpha(theme.palette.primary.main, 0.09)
                      : 'action.hover',
                  },
                  transition: 'background-color 0.12s ease',
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    border: `1.5px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                    bgcolor: isSelected ? 'primary.main' : 'transparent',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s ease',
                  }}
                  aria-hidden="true"
                >
                  {isSelected && <Check size={11} weight="bold" />}
                </Box>

                {m.user.image ? (
                  <Box
                    component="img"
                    src={m.user.image}
                    alt=""
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(m.user.name, m.user.email)}
                  </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      lineHeight: 1.2,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.user.name ?? m.user.email}
                  </Typography>
                  {m.user.name && (
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        color: 'text.secondary',
                        lineHeight: 1.3,
                        mt: 0.125,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.user.email}
                    </Typography>
                  )}
                </Box>

                {isSelected && (
                  <Select
                    value={role}
                    onChange={(e) =>
                      setRole(m.user.id, e.target.value as AssignableRole)
                    }
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    sx={{
                      minWidth: 130,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                      bgcolor: 'background.paper',
                      '& .MuiSelect-select': { py: 0.5, fontSize: '0.75rem' },
                    }}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        sx={{ fontSize: '0.8125rem' }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
            );
          })
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1.5,
          mt: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flexShrink: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            <Box
              component="span"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {selectedCount}
            </Box>{' '}
            selected
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Info size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: '0.6875rem',
                color: 'text.disabled',
                lineHeight: 1.3,
              }}
            >
              Need to invite someone outside your org? Use the{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                Team
              </Box>{' '}
              tab.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            onClick={onSkip}
            variant="text"
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Skip
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            size="small"
            disabled={selectedCount === 0}
            loading={bulkAdd.isPending}
            endIcon={<ArrowRight size={14} weight="bold" />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add to project
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
