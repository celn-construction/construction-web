'use client';

import { Box, Paper, Popper, Typography } from '@mui/material';
import { Clock, Search, Sparkles } from 'lucide-react';
import type { RecentSearch } from '@/hooks/useRecentSearches';

interface SearchSuggestionsPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  recents: RecentSearch[];
  examples: readonly string[];
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  listboxId: string;
  optionIdPrefix: string;
  onSelect: (query: string, aiMode: boolean) => void;
  onClearRecents: () => void;
}

export default function SearchSuggestionsPopover({
  open,
  anchorEl,
  recents,
  examples,
  highlightedIndex,
  onHighlightChange,
  listboxId,
  optionIdPrefix,
  onSelect,
  onClearRecents,
}: SearchSuggestionsPopoverProps) {
  const showRecents = recents.length > 0;
  const recentCount = showRecents ? recents.length : 0;

  return (
    <Popper
      open={open && !!anchorEl}
      anchorEl={anchorEl}
      placement="bottom-start"
      style={{ zIndex: 1300, width: anchorEl?.clientWidth }}
      modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
    >
      <Paper
        elevation={4}
        id={listboxId}
        role="listbox"
        sx={{
          borderRadius: '10px',
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {showRecents && (
          <Box sx={{ p: 1 }}>
            <SectionHeader icon={<Clock size={12} />} label="Recent">
              <Box
                component="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClearRecents}
                sx={{
                  fontSize: 11,
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  p: 0,
                  '&:hover': { color: 'text.primary', textDecoration: 'underline' },
                }}
              >
                Clear
              </Box>
            </SectionHeader>
            {recents.map((r, i) => (
              <SuggestionRow
                key={`recent-${i}-${r.query}`}
                id={`${optionIdPrefix}-${i}`}
                icon={r.aiMode ? <Sparkles size={14} /> : <Search size={14} />}
                label={r.query}
                highlighted={highlightedIndex === i}
                onMouseEnter={() => onHighlightChange(i)}
                onSelect={() => onSelect(r.query, r.aiMode)}
              />
            ))}
          </Box>
        )}
        {showRecents && <Box sx={{ height: 1, bgcolor: 'divider' }} />}
        <Box sx={{ p: 1 }}>
          <SectionHeader icon={<Sparkles size={12} />} label="Try asking AI" />
          {examples.map((example, j) => {
            const index = recentCount + j;
            return (
              <SuggestionRow
                key={example}
                id={`${optionIdPrefix}-${index}`}
                icon={<Sparkles size={14} />}
                label={example}
                italic
                highlighted={highlightedIndex === index}
                onMouseEnter={() => onHighlightChange(index)}
                onSelect={() => onSelect(example, true)}
              />
            );
          })}
        </Box>
      </Paper>
    </Popper>
  );
}

function SectionHeader({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        py: 0.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
        {icon}
        <Typography
          sx={{
            fontSize: '0.5625rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function SuggestionRow({
  id,
  icon,
  label,
  italic = false,
  highlighted,
  onMouseEnter,
  onSelect,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  italic?: boolean;
  highlighted: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
}) {
  return (
    <Box
      component="button"
      id={id}
      role="option"
      aria-selected={highlighted}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        width: '100%',
        bgcolor: highlighted ? 'action.hover' : 'transparent',
        border: 'none',
        borderRadius: '6px',
        px: 1,
        py: 0.875,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'text.primary',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', color: 'text.secondary', flexShrink: 0 }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 13,
          fontStyle: italic ? 'italic' : 'normal',
          color: italic ? 'text.secondary' : 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
