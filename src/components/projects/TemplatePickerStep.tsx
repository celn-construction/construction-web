'use client';

import {
  Box,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowRight,
  Buildings,
  Check,
  HouseLine,
  ListBullets,
  Wrench,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';

export type ProjectTemplateOption = 'BLANK';

interface TemplateCard {
  id: ProjectTemplateOption | 'RESIDENTIAL' | 'COMMERCIAL' | 'RENOVATION';
  name: string;
  meta: string;
  bullets: [string, string];
  Icon: ComponentType<{ size?: number; weight?: 'regular' | 'fill' | 'bold' }>;
  available: boolean;
}

const TEMPLATES: TemplateCard[] = [
  {
    id: 'BLANK',
    name: 'Blank',
    meta: 'No tasks · default',
    bullets: ['Empty Gantt chart', 'Build your own WBS'],
    Icon: ListBullets,
    available: true,
  },
  {
    id: 'RESIDENTIAL',
    name: 'Residential',
    meta: 'Coming soon',
    bullets: ['Site, foundation, framing', 'MEP, finishes, closeout'],
    Icon: HouseLine,
    available: false,
  },
  {
    id: 'COMMERCIAL',
    name: 'Commercial',
    meta: 'Coming soon',
    bullets: ['Permits, sitework, structure', 'Tenant fit-out, commissioning'],
    Icon: Buildings,
    available: false,
  },
  {
    id: 'RENOVATION',
    name: 'Renovation',
    meta: 'Coming soon',
    bullets: ['Demo, rough-in, finish', 'Punchlist & closeout'],
    Icon: Wrench,
    available: false,
  },
];

interface TemplatePickerStepProps {
  selected: ProjectTemplateOption;
  onSelect: (template: ProjectTemplateOption) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export default function TemplatePickerStep({
  selected,
  onSelect,
  onContinue,
  onCancel,
}: TemplatePickerStepProps) {
  const theme = useTheme();

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
          Choose a template
        </Typography>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: 'text.secondary',
            mt: 0.25,
            lineHeight: 1.4,
          }}
        >
          Start with a structured WBS or a clean slate.
        </Typography>
      </Box>

      <Box
        role="radiogroup"
        aria-label="Project template"
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridAutoRows: 'minmax(0, 1fr)',
          gap: 1,
        }}
      >
        {TEMPLATES.map((tpl) => {
          const isSelected = tpl.available && selected === tpl.id;
          const card = (
            <Box
              component="button"
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!tpl.available}
              disabled={!tpl.available}
              onClick={() => {
                if (tpl.available && tpl.id === 'BLANK') onSelect(tpl.id);
              }}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                textAlign: 'left',
                p: '12px 12px 11px',
                borderRadius: '12px',
                border: '1.5px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, 0.08)
                  : 'background.paper',
                color: 'text.primary',
                cursor: tpl.available ? 'pointer' : 'not-allowed',
                opacity: tpl.available ? 1 : 0.55,
                fontFamily: 'inherit',
                transition:
                  'border-color 0.12s ease, background-color 0.12s ease',
                '&:hover': tpl.available
                  ? {
                      borderColor: isSelected
                        ? 'primary.main'
                        : alpha(theme.palette.text.primary, 0.32),
                      bgcolor: isSelected
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'action.hover',
                    }
                  : {},
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              {isSelected && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Check size={11} weight="bold" />
                </Box>
              )}

              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <tpl.Icon size={16} weight="regular" />
              </Box>

              <Box sx={{ width: '100%' }}>
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {tpl.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    color: 'text.secondary',
                    mt: 0.25,
                    lineHeight: 1.3,
                  }}
                >
                  {tpl.meta}
                </Typography>
              </Box>

              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: '14px',
                  fontSize: '0.6875rem',
                  color: 'text.secondary',
                  lineHeight: 1.4,
                }}
              >
                {tpl.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </Box>
            </Box>
          );

          return tpl.available ? (
            <Box key={tpl.id} sx={{ display: 'flex' }}>
              {card}
            </Box>
          ) : (
            <Tooltip
              key={tpl.id}
              title="Construction templates are coming soon"
              arrow
              placement="top"
            >
              <Box sx={{ display: 'flex' }}>{card}</Box>
            </Tooltip>
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
          Continue
        </Button>
      </Box>
    </Box>
  );
}
