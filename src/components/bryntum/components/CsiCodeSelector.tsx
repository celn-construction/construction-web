'use client';

import { Tag, CaretRight } from '@phosphor-icons/react';
import { Box, Typography } from '@mui/material';
import { CSI_SUBDIVISION_MAP } from '@/lib/constants/csiCodes';

interface CsiCodeSelectorProps {
  csiCode: string | null | undefined;
  onOpen: () => void;
}

export default function CsiCodeSelector({ csiCode, onOpen }: CsiCodeSelectorProps) {
  const hasCode = !!csiCode;
  const subEntry = hasCode ? CSI_SUBDIVISION_MAP.get(csiCode!) : null;
  const divisionName = subEntry ? subEntry.division.name : null;
  const subdivisionName = subEntry ? subEntry.subdivision.name : null;

  return (
    <Box
      component="button"
      onClick={onOpen}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        bgcolor: hasCode ? 'action.selected' : 'transparent',
        cursor: 'pointer',
        px: 1.25,
        py: hasCode ? '8px' : '5px',
        width: '100%',
        textAlign: 'left',
        transition: 'background-color 0.15s, border-color 0.15s',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'text.disabled',
        },
      }}
    >
      <Tag
        size={14}
        weight={hasCode ? 'fill' : 'regular'}
        color="var(--text-secondary)"
        style={{ flexShrink: 0, marginTop: hasCode ? 1 : 0 }}
      />
      {hasCode ? (
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography
              component="span"
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}
            >
              {csiCode}
            </Typography>
            {divisionName && (
              <Typography
                component="span"
                sx={{
                  fontSize: '0.5625rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {divisionName}
              </Typography>
            )}
          </Box>
          {subdivisionName && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {subdivisionName}
            </Typography>
          )}
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'text.secondary',
            lineHeight: 1,
            flex: 1,
          }}
        >
          CSI Code
        </Typography>
      )}
      <CaretRight
        size={11}
        color="var(--text-secondary)"
        style={{ flexShrink: 0, marginTop: hasCode ? 2 : 0 }}
      />
    </Box>
  );
}
