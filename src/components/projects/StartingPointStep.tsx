'use client';

import {
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowRight,
  CaretRight,
  Check,
  HouseLine,
  ListBullets,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { RESIDENTIAL_LEAF_COUNT } from '@/lib/templates/residential';

export type ProjectTemplateOption = 'BLANK' | 'RESIDENTIAL';

interface PathDef {
  id: ProjectTemplateOption;
  name: string;
  meta: string;
  Icon: ComponentType<{ size?: number; weight?: 'regular' | 'fill' | 'bold' }>;
  /** True when selecting this path opens a follow-up sub-screen (shows › instead of ✓). */
  hasPreview: boolean;
}

const PATHS: PathDef[] = [
  {
    id: 'BLANK',
    name: 'Blank',
    meta: 'Empty schedule — build your own WBS from scratch',
    Icon: ListBullets,
    hasPreview: false,
  },
  {
    id: 'RESIDENTIAL',
    name: 'Residential template',
    meta: `${RESIDENTIAL_LEAF_COUNT} tasks · CSI tagged · single-family build`,
    Icon: HouseLine,
    hasPreview: true,
  },
];

interface StartingPointStepProps {
  selected: ProjectTemplateOption;
  onSelect: (option: ProjectTemplateOption) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export default function StartingPointStep({
  selected,
  onSelect,
  onContinue,
  onCancel,
}: StartingPointStepProps) {
  const theme = useTheme();
  const selectedPath = PATHS.find((p) => p.id === selected);
  const continueLabel =
    selectedPath && selectedPath.hasPreview ? 'Preview template' : 'Continue';

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
          How do you want to start?
        </Typography>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: 'text.secondary',
            mt: 0.25,
            lineHeight: 1.4,
          }}
        >
          Pick a starting point — you can edit everything later.
        </Typography>
      </Box>

      <Box
        role="radiogroup"
        aria-label="Project starting point"
        sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {PATHS.map((path) => {
          const isSelected = selected === path.id;
          return (
            <Box
              key={path.id}
              component="button"
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(path.id)}
              sx={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textAlign: 'left',
                p: '14px 16px',
                borderRadius: '12px',
                border: '1.5px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, 0.08)
                  : 'background.paper',
                color: 'text.primary',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition:
                  'border-color 0.12s ease, background-color 0.12s ease',
                '&:hover': {
                  borderColor: isSelected
                    ? 'primary.main'
                    : alpha(theme.palette.text.primary, 0.32),
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'action.hover',
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <path.Icon size={18} weight="regular" />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {path.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mt: 0.375,
                    lineHeight: 1.35,
                  }}
                >
                  {path.meta}
                </Typography>
              </Box>

              {isSelected ? (
                <Box
                  aria-hidden
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Check size={12} weight="bold" />
                </Box>
              ) : (
                <Box
                  aria-hidden
                  sx={{
                    width: 20,
                    height: 20,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'text.disabled',
                    flexShrink: 0,
                  }}
                >
                  <CaretRight size={14} weight="bold" />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          mt: 2.25,
          pt: 1.75,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          variant="text"
          onClick={onCancel}
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.8125rem',
            px: 2,
            borderRadius: '8px',
            '&:hover': {
              bgcolor: alpha(theme.palette.divider, 0.18),
              color: 'text.primary',
            },
          }}
        >
          Cancel
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
          {continueLabel}
        </Button>
      </Box>
    </Box>
  );
}
