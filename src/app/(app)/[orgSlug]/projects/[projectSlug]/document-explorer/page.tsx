'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Tooltip, Menu, MenuItem, useTheme } from '@mui/material';
import { IBeamLoader } from '@/components/ui/IBeamLoader';
import Pagination from '@/components/documents/Pagination';
import { FileText, ChevronDown, Sparkles, Search, AlignJustify, Table2, LayoutGrid } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '@/trpc/react';
import { authClient } from '@/lib/auth-client';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { expandFolderIds } from '@/lib/folders';
import { DOCUMENT_AI_SEARCH_EXAMPLES } from '@/lib/constants/documentSearchExamples';
import DocumentToolbar from '@/components/documents/DocumentToolbar';
import DocumentFilterTabs from '@/components/documents/DocumentFilterTabs';
import DocumentFilterPopup from '@/components/documents/DocumentFilterPopup';
import type { LinkFilter } from '@/components/documents/DocumentFilterPopup';
import DocumentCardCompact from '@/components/documents/DocumentCardCompact';
import DocumentCardDetail from '@/components/documents/DocumentCardDetail';
import DocumentCardGallery from '@/components/documents/DocumentCardGallery';
import type { DocumentResult } from '@/components/documents/types';

const LIMIT = 20;

type SortBy = 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'relevance';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt_desc', label: 'Date added (newest)' },
  { value: 'createdAt_asc', label: 'Date added (oldest)' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'size_desc', label: 'Size (largest)' },
  { value: 'size_asc', label: 'Size (smallest)' },
];

const RELEVANCE_OPTION: { value: SortBy; label: string } = { value: 'relevance', label: 'Relevance' };

export default function DocumentExplorerPage() {
  const theme = useTheme();
  const { projectId, organizationId } = useProjectContext();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const { recents, addRecent, clearRecents } = useRecentSearches(userId, projectId);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'detail' | 'gallery'>('compact');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt_desc');
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);

  // Debounce search input (only for fuzzy mode)
  useEffect(() => {
    if (aiEnabled) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, aiEnabled]);

  const offset = (page - 1) * LIMIT;

  // Derive folder filter from selected types
  const folderIds =
    selectedTypes.length === 0
      ? undefined
      : selectedTypes.flatMap((type) => expandFolderIds(type));

  const handleAiToggle = () => {
    setAiEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setAiSearchQuery('');
        setDebouncedQuery(query);
        if (sortBy === 'relevance') setSortBy('createdAt_desc');
      } else {
        setDebouncedQuery('');
        setSortBy('relevance');
      }
      setPage(1);
      return next;
    });
  };

  const handleAiSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setAiSearchQuery(trimmed);
    setPage(1);
    addRecent(trimmed, true);
  };

  const handleSelectSuggestion = (q: string, aiMode: boolean) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setPage(1);
    if (aiMode) {
      setAiEnabled(true);
      setSortBy('relevance');
      setDebouncedQuery('');
      setAiSearchQuery(trimmed);
    } else {
      setAiEnabled(false);
      setAiSearchQuery('');
      setSortBy((prev) => (prev === 'relevance' ? 'createdAt_desc' : prev));
      setDebouncedQuery(trimmed);
    }
    addRecent(trimmed, aiMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (aiEnabled) {
      handleAiSubmit();
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) return;
    setDebouncedQuery(trimmed);
    setPage(1);
    addRecent(trimmed, false);
  };

  const handleFilterApply = (types: string[], link: LinkFilter) => {
    setSelectedTypes(types);
    setLinkFilter(link);
    setPage(1);
  };

  const handleRemoveType = (type: string) => {
    setSelectedTypes((prev) => prev.filter((t) => t !== type));
    setPage(1);
  };

  const handleRemoveLinkFilter = () => {
    setLinkFilter('all');
    setPage(1);
  };

  // Fuzzy search (AI OFF)
  const fuzzyQuery = api.document.search.useQuery(
    { organizationId, projectId, query: debouncedQuery, limit: LIMIT, offset, folderIds, linkFilter, sortBy },
    { enabled: !aiEnabled && !!organizationId && !!projectId, placeholderData: keepPreviousData },
  );

  // AI semantic search (AI ON + query submitted)
  const aiQuery = api.document.aiSearch.useQuery(
    { organizationId, projectId, query: aiSearchQuery, limit: LIMIT, offset, folderIds, linkFilter, sortBy },
    { enabled: aiEnabled && !!aiSearchQuery && !!organizationId && !!projectId, staleTime: 60_000, retry: 1 },
  );

  // All docs fallback (AI ON, no search submitted)
  const allDocsQuery = api.document.search.useQuery(
    { organizationId, projectId, query: '', limit: LIMIT, offset, folderIds, linkFilter, sortBy },
    { enabled: aiEnabled && !aiSearchQuery && !!organizationId && !!projectId, placeholderData: keepPreviousData },
  );

  // Active data source
  const activeQuery = aiEnabled ? (aiSearchQuery ? aiQuery : allDocsQuery) : fuzzyQuery;

  const rawResults = (activeQuery.data?.results ?? []) as DocumentResult[];
  const total = activeQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const isLoading = activeQuery.isLoading;
  // Only show fuzzy loader on initial fetch (no cached data), not on background refetches
  const showFuzzyLoader = !aiEnabled && !!debouncedQuery && fuzzyQuery.isFetching && !fuzzyQuery.data;
  const isBackgroundFetching = activeQuery.isFetching && !isLoading && !showFuzzyLoader;

  const displayQuery =
    aiEnabled && aiSearchQuery
      ? aiSearchQuery
      : !aiEnabled && debouncedQuery
        ? debouncedQuery
        : '';

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DocumentToolbar
        query={query}
        onQueryChange={setQuery}
        onKeyDown={handleKeyDown}
        aiEnabled={aiEnabled}
        isAiSearching={aiEnabled && !!aiSearchQuery && aiQuery.isFetching}
        onAiToggle={handleAiToggle}
        onUploadClick={() => {/* Upload dialog integration deferred */}}
        recents={recents}
        examples={DOCUMENT_AI_SEARCH_EXAMPLES}
        onSelectSuggestion={handleSelectSuggestion}
        onClearRecents={clearRecents}
      />

      <DocumentFilterTabs
        selectedTypes={selectedTypes}
        linkFilter={linkFilter}
        onOpenPopup={(e) => setFilterAnchorEl(e.currentTarget)}
        onRemoveType={handleRemoveType}
        onRemoveLinkFilter={handleRemoveLinkFilter}
        isLoading={isLoading}
      />

      <DocumentFilterPopup
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        selectedTypes={selectedTypes}
        linkFilter={linkFilter}
        onClose={() => setFilterAnchorEl(null)}
        onApply={handleFilterApply}
      />

      {/* Count row */}
      {!isLoading && !showFuzzyLoader && total > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: 'text.secondary' }}>
            {displayQuery
              ? `${total} result${total !== 1 ? 's' : ''} for "${displayQuery}"`
              : `${total} document${total !== 1 ? 's' : ''}`}
          </Typography>

          {totalPages > 1 && (
            <Pagination count={totalPages} page={page} onChange={setPage} />
          )}

          {/* Right group: sort + view toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Sort control */}
            {(() => {
              const showRelevance = aiEnabled && !!aiSearchQuery;
              const options = showRelevance ? [RELEVANCE_OPTION, ...SORT_OPTIONS] : [...SORT_OPTIONS];
              const currentLabel = options.find((o) => o.value === sortBy)?.label ?? 'Date added (newest)';
              return (
                <>
                  <Box
                    component="button"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setSortAnchorEl(e.currentTarget)}
                    sx={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'text.secondary', background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 400, color: 'text.secondary' }}>
                      Sort by:
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>
                      {currentLabel}
                    </Typography>
                    <ChevronDown style={{ width: 14, height: 14, color: 'currentColor' }} />
                  </Box>
                  <Menu
                    anchorEl={sortAnchorEl}
                    open={Boolean(sortAnchorEl)}
                    onClose={() => setSortAnchorEl(null)}
                  >
                    {options.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        selected={sortBy === opt.value}
                        onClick={() => { setSortBy(opt.value); setSortAnchorEl(null); setPage(1); }}
                        sx={{ fontSize: 13 }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              );
            })()}

            {/* View toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid', borderColor: 'divider', p: '2px' }}>
              {([
                { mode: 'compact' as const, icon: <AlignJustify size={14} />, label: 'Compact' },
                { mode: 'detail' as const, icon: <Table2 size={14} />, label: 'Detail' },
                { mode: 'gallery' as const, icon: <LayoutGrid size={14} />, label: 'Gallery' },
              ]).map(({ mode, icon, label }) => (
                <Tooltip key={mode} title={label}>
                  <Box
                    component="button"
                    onClick={() => setViewMode(mode)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 28,
                      borderRadius: '6px',
                      border: 'none',
                      bgcolor: viewMode === mode ? 'secondary.main' : 'transparent',
                      color: viewMode === mode ? 'text.primary' : 'text.secondary',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s',
                      '&:hover': { bgcolor: viewMode === mode ? 'secondary.main' : 'action.hover' },
                    }}
                  >
                    {icon}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Loading state */}
      {(isLoading || showFuzzyLoader) && (() => {
        const isAiLoader = aiEnabled && !!aiSearchQuery;
        const activeSearchText = isAiLoader ? aiSearchQuery : debouncedQuery;

        // Initial browse (no search query) → loading spinner
        if (!activeSearchText) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, py: 8 }}>
              <IBeamLoader size={32} />
            </Box>
          );
        }

        // Active search → type-specific loader
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '20px',
              py: 8,
            }}
          >
            {/* Icon wrap */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(isAiLoader
                  ? { background: `linear-gradient(180deg, rgba(255,132,0,0.08) 0%, ${theme.palette.docExplorer.aiPurple}14 100%)` }
                  : { bgcolor: 'secondary.main' }),
              }}
            >
              <Box sx={{ color: isAiLoader ? 'docExplorer.aiPurple' : 'primary.main', display: 'flex' }}>
                {isAiLoader ? <Sparkles size={28} /> : <Search size={26} />}
              </Box>
            </Box>

            {/* Text group */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'text.primary' }}>
                {isAiLoader ? 'AI is searching your documents' : 'Searching your documents'}
              </Typography>
              <Typography sx={{ fontSize: 13, lineHeight: 1.4, color: 'text.secondary' }}>
                Looking for &ldquo;{activeSearchText}&rdquo;&hellip;
              </Typography>
              <Typography sx={{ fontSize: 11, lineHeight: 1.4, color: 'text.secondary', opacity: 0.7 }}>
                {isAiLoader ? 'Scanning documents across categories' : 'Checking documents across categories'}
              </Typography>
            </Box>

            {/* Progress track */}
            <Box
              sx={{
                width: 200,
                height: 3,
                borderRadius: '999px',
                bgcolor: 'secondary.main',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: '40%',
                  borderRadius: '999px',
                  ...(isAiLoader
                    ? { background: `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.docExplorer.aiPurple} 100%)` }
                    : { bgcolor: 'primary.main' }),
                  animation: 'searchSlide 1.8s ease-in-out infinite',
                  '@keyframes searchSlide': {
                    '0%': { transform: 'translateX(-200%)' },
                    '100%': { transform: 'translateX(500%)' },
                  },
                }}
              />
            </Box>
          </Box>
        );
      })()}

      {/* Empty state */}
      {!isLoading && !showFuzzyLoader && rawResults.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            py: 8,
          }}
        >
          <FileText size={48} style={{ color: 'var(--text-disabled)', marginBottom: 16 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
            {displayQuery ? 'No results found' : 'No documents yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {displayQuery
              ? `No documents match "${displayQuery}"`
              : 'Upload documents to see them here'}
          </Typography>
        </Box>
      )}

      {/* Results */}
      {!isLoading && !showFuzzyLoader && rawResults.length > 0 && (() => {
        const opacitySx = { opacity: isBackgroundFetching ? 0.6 : 1, transition: 'opacity 0.2s' };

        if (viewMode === 'gallery') {
          return (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 1.5,
                ...opacitySx,
              }}
            >
              {rawResults.map((doc) => (
                <DocumentCardGallery key={doc.id} doc={doc} organizationId={organizationId} />
              ))}
            </Box>
          );
        }

        if (viewMode === 'detail') {
          return (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, 260px)',
                gap: 2,
                alignItems: 'start',
                ...opacitySx,
              }}
            >
              {rawResults.map((doc) => (
                <DocumentCardDetail key={doc.id} doc={doc} organizationId={organizationId} />
              ))}
            </Box>
          );
        }

        // Compact view — stacked rows with thumbnails
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', ...opacitySx }}>
            {rawResults.map((doc) => (
              <DocumentCardCompact key={doc.id} doc={doc} organizationId={organizationId} />
            ))}
          </Box>
        );
      })()}
    </Box>
  );
}
