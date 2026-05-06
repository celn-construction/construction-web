'use client';

import { Box, InputBase, Typography, Tooltip, keyframes, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Sparkles, Search, Upload, ArrowUp } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import SearchSuggestionsPopover from './SearchSuggestionsPopover';
import type { RecentSearch } from '@/hooks/useRecentSearches';

interface DocumentToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
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
  onSubmit,
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

  const listboxId = useId();
  const optionIdPrefix = useId();

  const displayRecents = useMemo(
    () => recents.filter((r) => r.aiMode === aiEnabled),
    [recents, aiEnabled],
  );
  const displayExamples = aiEnabled ? examples : [];

  const items = useMemo(
    () => [
      ...displayRecents.map((r) => ({ query: r.query, aiMode: r.aiMode })),
      ...displayExamples.map((q) => ({ query: q, aiMode: true })),
    ],
    [displayRecents, displayExamples],
  );

  const hasSuggestions = displayRecents.length > 0 || displayExamples.length > 0;
  const showSuggestions = isFocused && !query.trim() && hasSuggestions;

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

  const shimmerAnim = keyframes`
    0% { transform: translateX(-100%); }
    55%, 100% { transform: translateX(100%); }
  `;

  const twinkleAnim = keyframes`
    0%, 100% { opacity: 0.55; transform: rotate(0deg) scale(1); }
    50% { opacity: 1; transform: rotate(8deg) scale(1.08); }
  `;

  const pulseDotAnim = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  `;

  const canSubmit = !!query.trim();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Search input */}
        <Box
          ref={searchBoxRef}
          sx={{
            display: 'flex',
            flexDirection: aiEnabled ? 'column' : 'row',
            alignItems: aiEnabled ? 'stretch' : 'center',
            gap: aiEnabled ? '14px' : '10px',
            flex: 1,
            borderRadius: aiEnabled ? '16px' : '8px',
            bgcolor: 'background.paper',
            px: aiEnabled ? '20px' : 2,
            py: aiEnabled ? '16px' : 1.5,
            border: aiEnabled ? '1px solid' : '1.5px solid transparent',
            borderColor: aiEnabled ? 'divider' : undefined,
            backgroundImage: aiEnabled
              ? undefined
              : `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), linear-gradient(90deg, ${primary}66, ${primaryDark}66)`,
            backgroundOrigin: aiEnabled ? undefined : 'border-box',
            backgroundClip: aiEnabled ? undefined : 'padding-box, border-box',
            boxShadow: aiEnabled ? '0 1px 2px rgba(0,0,0,0.04)' : undefined,
            transition: 'background-image 0.4s, background-color 0.4s, box-shadow 0.4s, border-color 0.3s, border-radius 0.3s, padding 0.3s',
            animation: aiEnabled ? `${glowPulse} 0.6s ease-out` : 'none',
            '&:focus-within': aiEnabled
              ? { borderColor: 'primary.main' }
              : {
                  backgroundImage: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), linear-gradient(90deg, ${primary}, ${primaryDark})`,
                },
          }}
        >
          {/* Top row: icon + input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: aiEnabled ? '12px' : '10px', width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: aiEnabled ? 18 : 16,
                height: aiEnabled ? 18 : 16,
                flexShrink: 0,
                transition: 'transform 0.3s ease',
                transform: aiEnabled ? 'scale(1)' : 'rotate(0deg) scale(1)',
              }}
            >
              <Search size={aiEnabled ? 18 : 16} style={{ color: theme.palette.text.secondary }} />
            </Box>
            <InputBase
              inputRef={inputRef}
              placeholder={aiEnabled ? 'Ask anything...' : 'Search documents...'}
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
                fontSize: aiEnabled ? 15 : 14,
                '& .MuiInputBase-input': {
                  p: 0,
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: aiEnabled ? 0.85 : 1,
                    transition: 'color 0.3s, opacity 0.3s',
                  },
                },
              }}
            />
            {!aiEnabled && isAiSearching && (
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

          {/* Bottom row (AI mode only): send button */}
          {aiEnabled && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
              }}
            >
              {isAiSearching && (
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '3px',
                    bgcolor: 'primary.main',
                    animation: `${spinSlow} 3s linear infinite`,
                  }}
                />
              )}
              <Tooltip title={canSubmit ? 'Search' : 'Type a query'}>
                <Box
                  component="button"
                  onClick={() => {
                    if (!canSubmit) return;
                    onSubmit();
                  }}
                  disabled={!canSubmit}
                  aria-label="Submit AI search"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: canSubmit ? 'primary.main' : 'action.hover',
                    color: canSubmit ? 'primary.contrastText' : 'text.secondary',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
                    '&:hover': canSubmit ? { opacity: 0.9 } : undefined,
                  }}
                >
                  <ArrowUp size={16} />
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* AI mode toggle (segmented + glow/shimmer) */}
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              alignItems: 'stretch',
              height: 36,
              p: '3px',
              borderRadius: '999px',
              bgcolor: 'action.selected',
              border: '1px solid',
              borderColor: 'divider',
              userSelect: 'none',
              transition: 'box-shadow 0.32s ease, border-color 0.32s ease',
              boxShadow: aiEnabled ? `0 0 0 3px ${alpha(primary, 0.30)}` : 'none',
            }}
          >
            {/* Sliding indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: '3px',
                bottom: '3px',
                left: '3px',
                width: 'calc(50% - 3px)',
                borderRadius: '999px',
                bgcolor: aiEnabled ? undefined : 'background.paper',
                backgroundImage: aiEnabled
                  ? `linear-gradient(90deg, ${primary}, ${primaryDark})`
                  : undefined,
                boxShadow: aiEnabled
                  ? `0 1px 3px rgba(0,0,0,0.28), 0 0 12px ${alpha(primary, 0.30)}`
                  : '0 1px 3px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                transform: aiEnabled ? 'translateX(100%)' : 'translateX(0)',
                transition:
                  'transform 0.36s cubic-bezier(0.4, 0, 0.2, 1), background-image 0.32s ease, box-shadow 0.32s ease',
                zIndex: 1,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(105deg, transparent 0%, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%, transparent 100%)',
                  transform: 'translateX(-100%)',
                  animation: aiEnabled ? `${shimmerAnim} 2.6s ease-in-out infinite` : 'none',
                  pointerEvents: 'none',
                },
              }}
            />

            {/* Search segment */}
            <Tooltip title="Match exact keywords">
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (aiEnabled) onAiToggle();
                }}
                aria-pressed={!aiEnabled}
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  px: '14px',
                  color: aiEnabled ? 'text.secondary' : 'text.primary',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: '999px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.28s ease',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <Search size={13} />
                Search
              </Box>
            </Tooltip>

            {/* AI segment */}
            <Tooltip title="Ask in plain English">
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (!aiEnabled) onAiToggle();
                }}
                aria-pressed={aiEnabled}
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  px: '14px',
                  color: aiEnabled ? 'primary.contrastText' : 'text.secondary',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: '999px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.28s ease',
                  '&:hover': aiEnabled ? undefined : { color: 'text.primary' },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    animation: aiEnabled ? 'none' : `${twinkleAnim} 3.2s ease-in-out infinite`,
                  }}
                >
                  <Sparkles size={13} />
                </Box>
                AI
              </Box>
            </Tooltip>
          </Box>

          {/* Microcopy — names what each mode does */}
          <Box
            sx={{
              height: 14,
              fontSize: 11,
              color: aiEnabled ? 'text.secondary' : 'text.disabled',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              transition: 'color 0.28s',
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: aiEnabled ? 'primary.main' : 'text.disabled',
                animation: aiEnabled ? `${pulseDotAnim} 2s ease-in-out infinite` : 'none',
                transition: 'background-color 0.28s',
              }}
            />
            {aiEnabled ? 'Understands meaning & context' : 'Matches keywords in filenames & tags'}
          </Box>
        </Box>

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
        recents={displayRecents}
        examples={displayExamples}
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
