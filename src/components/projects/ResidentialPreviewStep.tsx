'use client';

import { useMemo } from 'react';
import {
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { ArrowLeft, ArrowRight, HouseLine } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  RESIDENTIAL_TASKS,
  RESIDENTIAL_LEAF_COUNT,
  type ResidentialTemplateTask,
} from '@/lib/templates/residential';
import { formatCsiCode } from '@/lib/constants/csiCodes';

interface ResidentialPreviewStepProps {
  onBack: () => void;
  onContinue: () => void;
}

interface PhaseGroup {
  parent: ResidentialTemplateTask;
  children: ResidentialTemplateTask[];
  totalDays: number;
}

function buildPhaseGroups(): PhaseGroup[] {
  const parents = RESIDENTIAL_TASKS.filter((t) => !t.parentKey);
  return parents.map((parent) => {
    const children = RESIDENTIAL_TASKS.filter(
      (t) => t.parentKey === parent.key
    );
    const start = Math.min(
      ...children.map((c) => c.startOffsetDays ?? 0)
    );
    const end = Math.max(
      ...children.map((c) => (c.startOffsetDays ?? 0) + (c.duration ?? 0))
    );
    return { parent, children, totalDays: end - start };
  });
}

export default function ResidentialPreviewStep({
  onBack,
  onContinue,
}: ResidentialPreviewStepProps) {
  const theme = useTheme();
  const groups = useMemo(buildPhaseGroups, []);
  const totalDays = useMemo(
    () => groups.reduce((acc, g) => Math.max(acc, lastEnd(g.children)), 0),
    [groups]
  );

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontSize: '1.0625rem',
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
          }}
        >
          Residential template
        </Typography>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: 'text.secondary',
            mt: 0.25,
            lineHeight: 1.4,
          }}
        >
          A standard single-family build. Edit, add, or remove anything once the
          project is created.
        </Typography>
      </Box>

      {/* Summary banner */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          p: '10px 12px',
          borderRadius: '8px',
          bgcolor: alpha(theme.palette.warning.main, 0.08),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            bgcolor: alpha(theme.palette.warning.main, 0.18),
            color: 'warning.main',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <HouseLine size={16} weight="regular" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {RESIDENTIAL_LEAF_COUNT} tasks · ~{Math.round(totalDays / 7)} weeks
          </Typography>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: 'text.secondary',
              mt: 0.25,
              lineHeight: 1.3,
            }}
          >
            {groups.length} phases · CSI tagged · standard durations
          </Typography>
        </Box>
      </Box>

      {/* Phase / task list */}
      <Box
        sx={{
          maxHeight: 320,
          overflowY: 'auto',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          bgcolor: 'background.paper',
        }}
      >
        {groups.map((group, idx) => (
          <Box
            key={group.parent.key}
            sx={{
              borderTop: idx === 0 ? 'none' : `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Phase header */}
            <Box
              sx={{
                px: 1.25,
                py: 0.875,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  letterSpacing: '-0.005em',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.parent.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {group.totalDays}d · {group.children.length} tasks
              </Typography>
            </Box>

            {/* Child tasks */}
            {group.children.map((child) => (
              <Box
                key={child.key}
                sx={{
                  pl: 2.5,
                  pr: 1.25,
                  py: 0.625,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.primary',
                    lineHeight: 1.35,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {child.name}
                </Typography>
                {child.csiCode && (
                  <Typography
                    sx={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Consolas, monospace',
                      fontSize: '0.625rem',
                      color: 'text.disabled',
                      flexShrink: 0,
                    }}
                    title={formatCsiCode(child.csiCode)}
                  >
                    {child.csiCode}
                  </Typography>
                )}
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    color: 'text.secondary',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 28,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {child.duration}d
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mt: 2.25,
          pt: 1.75,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          variant="text"
          onClick={onBack}
          startIcon={<ArrowLeft size={14} />}
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.8125rem',
            px: 1.5,
            borderRadius: '8px',
            '&:hover': {
              bgcolor: alpha(theme.palette.divider, 0.18),
              color: 'text.primary',
            },
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onContinue}
          endIcon={<ArrowRight size={16} />}
          sx={{
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.8125rem',
            px: 2.5,
            py: 1,
            textTransform: 'none',
            boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.25)}`,
            '& .MuiButton-endIcon': {
              transition: 'transform 0.15s ease',
            },
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              '& .MuiButton-endIcon': { transform: 'translateX(3px)' },
            },
          }}
        >
          Use template
        </Button>
      </Box>
    </Box>
  );
}

function lastEnd(children: ResidentialTemplateTask[]): number {
  return children.reduce(
    (acc, c) => Math.max(acc, (c.startOffsetDays ?? 0) + (c.duration ?? 0)),
    0
  );
}
