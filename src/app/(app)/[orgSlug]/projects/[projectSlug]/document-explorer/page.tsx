'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import Pagination from '@/components/documents/Pagination';
import { FileText, LayoutGrid, List, ChevronDown, Sparkles, Search } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '@/trpc/react';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { expandFolderIds } from '@/lib/folders';
import DocumentToolbar from '@/components/documents/DocumentToolbar';
import DocumentFilterTabs from '@/components/documents/DocumentFilterTabs';
import DocumentFilterPopup from '@/components/documents/DocumentFilterPopup';
import type { LinkFilter } from '@/components/documents/DocumentFilterPopup';
import DocumentCard from '@/components/documents/DocumentCard';
import DocumentTable from '@/components/documents/DocumentTable';
import type { DocumentResult } from '@/components/documents/types';

const LIMIT = 20;

export default function DocumentExplorerPage() {
  const theme = useTheme();
  const { projectId, organizationId } = useProjectContext();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      } else {
        setDebouncedQuery('');
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (aiEnabled && e.key === 'Enter') {
      e.preventDefault();
      handleAiSubmit();
    }
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
    { organizationId, projectId, query: debouncedQuery, limit: LIMIT, offset, folderIds, linkFilter },
    { enabled: !aiEnabled && !!organizationId && !!projectId, placeholderData: keepPreviousData },
  );

  // AI semantic search (AI ON + query submitted)
  const aiQuery = api.document.aiSearch.useQuery(
    { organizationId, projectId, query: aiSearchQuery, limit: LIMIT, offset, folderIds, linkFilter },
    { enabled: aiEnabled && !!aiSearchQuery && !!organizationId && !!projectId, staleTime: 60_000, retry: 1 },
  );

  // All docs fallback (AI ON, no search submitted)
  const allDocsQuery = api.document.search.useQuery(
    { organizationId, projectId, query: '', limit: LIMIT, offset, folderIds, linkFilter },
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'text.secondary' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 400, color: 'text.secondary' }}>
                Sort by:
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>
                Date added
              </Typography>
              <ChevronDown style={{ width: 14, height: 14, color: 'currentColor' }} />
            </Box>

            {/* View toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Box
                component="button"
                onClick={() => setViewMode('grid')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  border: 'none',
                  bgcolor: viewMode === 'grid' ? 'secondary.main' : 'transparent',
                  color: viewMode === 'grid' ? 'text.primary' : 'text.secondary',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'secondary.main' },
                }}
              >
                <LayoutGrid size={16} />
              </Box>
              <Box
                component="button"
                onClick={() => setViewMode('list')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  border: 'none',
                  bgcolor: viewMode === 'list' ? 'secondary.main' : 'transparent',
                  color: viewMode === 'list' ? 'text.primary' : 'text.secondary',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'secondary.main' },
                }}
              >
                <List size={16} />
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Loading state */}
      {(isLoading || showFuzzyLoader) && (() => {
        const isAiLoader = aiEnabled && !!aiSearchQuery;
        const activeSearchText = isAiLoader ? aiSearchQuery : debouncedQuery;

        // Initial browse (no search query) → skeleton cards
        if (!activeSearchText) {
          return viewMode === 'grid' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 280px)', gap: 2, alignItems: 'start' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
                  {/* Image area — 160px, matches card image container */}
                  <Skeleton variant="rectangular" height={160} sx={{ display: 'block' }} />

                  {/* Card body — px 16, pt 16, pb 12, gap 12 */}
                  <Box sx={{ px: '16px', pt: '16px', pb: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Title — single truncated line */}
                    <Skeleton variant="rectangular" width="72%" height={13} sx={{ borderRadius: '4px' }} />

                    {/* Category row — small icon + pill badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Skeleton variant="circular" width={11} height={11} />
                      <Skeleton variant="rectangular" width={72} height={20} sx={{ borderRadius: '999px' }} />
                    </Box>

                    {/* Meta row — date left, file size right */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Skeleton variant="rectangular" width={88} height={11} sx={{ borderRadius: '4px' }} />
                      <Skeleton variant="rectangular" width={36} height={11} sx={{ borderRadius: '4px' }} />
                    </Box>

                    {/* Task link row — icon + short label, pt 6 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', pt: '6px' }}>
                      <Skeleton variant="circular" width={12} height={12} />
                      <Skeleton variant="rectangular" width={80} height={11} sx={{ borderRadius: '4px' }} />
                    </Box>
                  </Box>

                  {/* Divider */}
                  <Box sx={{ height: '1px', bgcolor: 'divider' }} />

                  {/* Action row — px 16, py 8 — 3 icons left, 1 right */}
                  <Box sx={{ px: '16px', py: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Skeleton variant="circular" width={14} height={14} />
                      <Skeleton variant="circular" width={14} height={14} />
                      <Skeleton variant="circular" width={14} height={14} />
                    </Box>
                    <Skeleton variant="circular" width={14} height={14} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
              ))}
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
      {!isLoading && !showFuzzyLoader && rawResults.length > 0 && (
        viewMode === 'grid' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 280px)',
              gap: 2,
              alignItems: 'start',
              opacity: isBackgroundFetching ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {rawResults.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} organizationId={organizationId} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              opacity: isBackgroundFetching ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <DocumentTable docs={rawResults} />
          </Box>
        )
      )}
    </Box>
  );
}
