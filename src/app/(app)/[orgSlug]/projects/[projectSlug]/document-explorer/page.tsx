'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Pagination, Skeleton, LinearProgress } from '@mui/material';
import { FileText, LayoutGrid, List } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '@/trpc/react';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { expandFolderIds } from '@/lib/folders';
import DocumentToolbar from '@/components/documents/DocumentToolbar';
import DocumentFilterTabs from '@/components/documents/DocumentFilterTabs';
import DocumentCard from '@/components/documents/DocumentCard';
import DocumentTable from '@/components/documents/DocumentTable';
import type { DocumentResult } from '@/components/documents/types';

const LIMIT = 20;

export default function DocumentExplorerPage() {
  const { projectId, organizationId } = useProjectContext();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');

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

  // Derive folder filter from active tab
  const folderIds = ['all', 'linked', 'unlinked'].includes(activeTab)
    ? undefined
    : expandFolderIds(activeTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

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

  // Fuzzy search (AI OFF)
  const fuzzyQuery = api.document.search.useQuery(
    { organizationId, projectId, query: debouncedQuery, limit: LIMIT, offset, folderIds },
    { enabled: !aiEnabled && !!organizationId && !!projectId, placeholderData: keepPreviousData },
  );

  // AI semantic search (AI ON + query submitted)
  const aiQuery = api.document.aiSearch.useQuery(
    { organizationId, projectId, query: aiSearchQuery, limit: LIMIT, offset, folderIds },
    { enabled: aiEnabled && !!aiSearchQuery && !!organizationId && !!projectId, staleTime: 60_000, retry: 1 },
  );

  // All docs fallback (AI ON, no search submitted)
  const allDocsQuery = api.document.search.useQuery(
    { organizationId, projectId, query: '', limit: LIMIT, offset, folderIds },
    { enabled: aiEnabled && !aiSearchQuery && !!organizationId && !!projectId, placeholderData: keepPreviousData },
  );

  // Active data source
  const activeQuery = aiEnabled ? (aiSearchQuery ? aiQuery : allDocsQuery) : fuzzyQuery;

  const rawResults = (activeQuery.data?.results ?? []) as DocumentResult[];
  const total = activeQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const isLoading = activeQuery.isLoading;
  const isBackgroundFetching = activeQuery.isFetching && !isLoading;

  // Client-side linked filter
  const filteredResults = activeTab === 'linked'
    ? rawResults.filter((d) => d.taskId)
    : activeTab === 'unlinked'
      ? rawResults.filter((d) => !d.taskId)
      : rawResults;

  const displayQuery = aiEnabled && aiSearchQuery
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

      <DocumentFilterTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Fetching indicator */}
      <Box sx={{ height: 4, mb: 1 }}>
        {isBackgroundFetching && <LinearProgress sx={{ borderRadius: 1 }} />}
      </Box>

      {/* Count row — design: doc count | pagination | sort + view toggle */}
      {!isLoading && total > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: '#8D99AE' }}>
            {displayQuery
              ? `${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''} for "${displayQuery}"`
              : `${filteredResults.length} document${filteredResults.length !== 1 ? 's' : ''}`}
          </Typography>

          {/* Pagination (centered) */}
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="small"
            />
          )}

          {/* View toggle — design: 32x32 buttons, cornerRadius 6, active fill #F0F0F3 */}
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
                bgcolor: viewMode === 'grid' ? '#F0F0F3' : 'transparent',
                color: viewMode === 'grid' ? '#1A1A2E' : '#8D99AE',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#F0F0F3' },
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
                bgcolor: viewMode === 'list' ? '#F0F0F3' : 'transparent',
                color: viewMode === 'list' ? '#1A1A2E' : '#8D99AE',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#F0F0F3' },
              }}
            >
              <List size={16} />
            </Box>
          </Box>
        </Box>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        viewMode === 'grid' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, alignItems: 'start' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ borderRadius: '14px', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={180} />
                <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Skeleton width="75%" height={17} />
                  <Skeleton width="30%" height={16} sx={{ borderRadius: '999px' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton width="45%" height={13} />
                    <Skeleton width="20%" height={13} />
                  </Box>
                  <Skeleton width="40%" height={13} sx={{ mt: '6px' }} />
                </Box>
                <Box sx={{ height: '1px', bgcolor: 'divider' }} />
                <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
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
        )
      )}

      {/* Empty state */}
      {!isLoading && filteredResults.length === 0 && (
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
      {!isLoading && filteredResults.length > 0 && (
        viewMode === 'grid' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 2,
              alignItems: 'start',
              opacity: isBackgroundFetching ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {filteredResults.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              opacity: isBackgroundFetching ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <DocumentTable docs={filteredResults} />
          </Box>
        )
      )}
    </Box>
  );
}
