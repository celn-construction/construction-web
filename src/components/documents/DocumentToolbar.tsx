'use client';

import { Box, InputBase, Typography, Tooltip, keyframes, useTheme } from '@mui/material';
import { Sparkles, Search, Upload } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import SearchSuggestionsPopover from './SearchSuggestionsPopover';
import type { RecentSearch } from '@/hooks/useRecentSearches';

interface DocumentToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  aiEnabled: boolean;
  isAiSearching: boolean;
  onAiToggle: () => void;
  onUploadClick: () => void;
  recents: RecentSearch[];
  examples: readonly string[];
  onSelectSuggestion: (query: string, aiMode: boolean) => void;
  onClearRecents: () => void;
}

export default function DocumentToolbar({
  query,
  onQueryChange,
  onKeyDown,
  aiEnabled,
  isAiSearching,
  onAiToggle,
  onUploadClick,
  recents,
  examples,
  onSelectSuggestion,
  onClearRecents,
}: DocumentToolbarProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const showSuggestions = isFocused && !query.trim();

  const listboxId = useId();
  const optionIdPrefix = useId();

  const items = useMemo(
    () => [
      ...recents.map((r) => ({ query: r.query, aiMode: r.aiMode })),
      ...examples.map((q) => ({ query: q, aiMode: true })),
    ],
    [recents, examples],
  );

  useEffect(() => {
    if (!showSuggestions) setHighlightedIndex(-1);
  }, [showSuggestions]);

  useEffect(() => {
    setHighlightedIndex((prev) => (prev >= items.length ? -1 : prev));
  }, [items.length]);

  const handleSelect = (q: string, aiMode: boolean) => {
    setIsFocused(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
    onSelectSuggestion(q, aiMode);
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showSuggestions) {
      e.preventDefault();
      setIsFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (showSuggestions && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % items.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setHighlightedIndex(0);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        setHighlightedIndex(items.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        const item = items[highlightedIndex];
        if (item) {
          e.preventDefault();
          handleSelect(item.query, item.aiMode);
          return;
        }
      }
    }
    onKeyDown(e);
  };

  const activeOptionId =
    showSuggestions && highlightedIndex >= 0 ? `${optionIdPrefix}-${highlightedIndex}` : undefined;

  const glowPulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
    40% { box-shadow: 0 0 16px 4px rgba(0, 0, 0, 0.15); }
    100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
  `;

  const spinSlow = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Search input */}
        <Box
          ref={searchBoxRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flex: 1,
            borderRadius: '8px',
            bgcolor: 'background.paper',
            px: 2,
            py: 1.5,
            border: '1.5px solid transparent',
            backgroundImage: aiEnabled
              ? `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), linear-gradient(90deg, ${primary}, ${primaryDark})`
              : `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), linear-gradient(90deg, ${primary}66, ${primaryDark}66)`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            transition: 'background-image 0.4s, background-color 0.4s, box-shadow 0.4s',
            animation: aiEnabled ? `${glowPulse} 0.6s ease-out` : 'none',
            '&:focus-within': {
              backgroundImage: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), linear-gradient(90deg, ${primary}, ${primaryDark})`,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              flexShrink: 0,
              transition: 'transform 0.3s ease',
              transform: aiEnabled ? 'rotate(72deg) scale(1.1)' : 'rotate(0deg) scale(1)',
            }}
          >
            {aiEnabled ? (
              <Sparkles size={16} style={{ color: primary }} />
            ) : (
              <Search size={16} style={{ color: theme.palette.text.secondary }} />
            )}
          </Box>
          <InputBase
            inputRef={inputRef}
            placeholder={aiEnabled ? 'Ask AI to find a document...' : 'Search documents...'}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            fullWidth
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            sx={{
              fontSize: 14,
              '& .MuiInputBase-input': {
                p: 0,
                '&::placeholder': {
                  color: aiEnabled ? 'primary.main' : 'text.secondary',
                  opacity: aiEnabled ? 0.7 : 1,
                  transition: 'color 0.3s, opacity 0.3s',
                },
              },
            }}
          />
          {isAiSearching && (
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '3px',
                bgcolor: 'primary.main',
                flexShrink: 0,
                animation: `${spinSlow} 3s linear infinite`,
              }}
            />
          )}
        </Box>

        {/* AI toggle */}
      <Tooltip title={aiEnabled ? 'AI search on' : 'AI search off'}>
        <Box
          component="button"
          onClick={onAiToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '8px',
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: '14px',
            py: 1,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Sparkles size={16} style={{ color: primary }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>
            AI
          </Typography>
          {/* Custom toggle track */}
          <Box
            sx={{
              position: 'relative',
              width: 36,
              height: 20,
              borderRadius: '999px',
              background: aiEnabled
                ? `linear-gradient(90deg, ${primary}, ${primaryDark})`
                : 'divider',
              bgcolor: aiEnabled ? undefined : 'divider',
              transition: 'background 0.3s ease',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                left: aiEnabled ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                boxShadow: 1,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </Box>
        </Box>
      </Tooltip>

      {/* Upload button */}
      <Box
        component="button"
        onClick={onUploadClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: '8px',
          bgcolor: 'accent.dark',
          border: 'none',
          px: '20px',
          py: 1.5,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          '&:hover': { opacity: 0.9 },
        }}
      >
        <Upload size={16} style={{ color: theme.palette.background.paper }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, color: 'background.paper' }}>
          Upload
        </Typography>
      </Box>
      </Box>
      {isAiSearching && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', pl: 2 }}>
          AI is thinking...
        </Typography>
      )}
      <SearchSuggestionsPopover
        open={showSuggestions}
        anchorEl={searchBoxRef.current}
        recents={recents}
        examples={examples}
        highlightedIndex={highlightedIndex}
        onHighlightChange={setHighlightedIndex}
        listboxId={listboxId}
        optionIdPrefix={optionIdPrefix}
        onSelect={handleSelect}
        onClearRecents={onClearRecents}
      />
    </Box>
  );
}
