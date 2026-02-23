'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Pagination,
  Skeleton,
  Chip,
  LinearProgress,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Sparkles, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '@/trpc/react';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { folderData, expandFolderIds } from '@/lib/folders';
import { getFileIcon } from '@/lib/utils/files';
import { formatFileSize } from '@/lib/utils/formatting';

const LIMIT = 20;

export default function DocumentExplorerPage() {
  const { projectId, organizationId } = useProjectContext();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');

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

  const folderIds =
    selectedFolders.size > 0
      ? [...selectedFolders].flatMap((id) => expandFolderIds(id))
      : undefined;

  const toggleFolder = (id: string) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setPage(1);
  };

  const handleAiToggle = () => {
    setAiEnabled((prev) => {
      const next = !prev;
      if (!next) {
        // Switching back to fuzzy: clear AI state, sync debounced query
        setAiSearchQuery('');
        setDebouncedQuery(query);
      } else {
        // Switching to AI: clear debounced to avoid stale fuzzy query
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

  // Fuzzy search query (AI OFF)
  const fuzzyQuery = api.document.search.useQuery(
    {
      organizationId,
      projectId,
      query: debouncedQuery,
      limit: LIMIT,
      offset,
      folderIds,
    },
    {
      enabled: !aiEnabled && !!organizationId && !!projectId,
      placeholderData: keepPreviousData,
    },
  );

  // AI semantic search query (AI ON)
  const aiQuery = api.document.aiSearch.useQuery(
    {
      organizationId,
      projectId,
      query: aiSearchQuery,
      limit: LIMIT,
      offset,
      folderIds,
    },
    {
      enabled: aiEnabled && !!aiSearchQuery && !!organizationId && !!projectId,
      staleTime: 60_000,
      retry: 1,
    },
  );

  // When AI is on but no search submitted, show all docs via fuzzy (empty query)
  const allDocsQuery = api.document.search.useQuery(
    {
      organizationId,
      projectId,
      query: '',
      limit: LIMIT,
      offset,
      folderIds,
    },
    {
      enabled: aiEnabled && !aiSearchQuery && !!organizationId && !!projectId,
      placeholderData: keepPreviousData,
    },
  );

  // Pick the active data source
  const activeQuery = aiEnabled
    ? aiSearchQuery
      ? aiQuery
      : allDocsQuery
    : fuzzyQuery;

  const results = activeQuery.data?.results ?? [];
  const total = activeQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const isLoading = activeQuery.isLoading;
  const isBackgroundFetching = activeQuery.isFetching && !isLoading;

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search bar row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <TextField
          placeholder={aiEnabled ? 'Describe what you\'re looking for...' : 'Search documents...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {aiEnabled ? (
                    <Sparkles size={18} style={{ color: 'var(--mui-palette-primary-main, #1976d2)' }} />
                  ) : (
                    <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Search button (AI mode only) */}
        {aiEnabled && (
          <Tooltip title="Search">
            <IconButton
              onClick={handleAiSubmit}
              color="primary"
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                borderRadius: 1,
                px: 2,
              }}
            >
              <Search size={18} />
            </IconButton>
          </Tooltip>
        )}

        {/* AI toggle */}
        <Tooltip title={aiEnabled ? 'AI search on' : 'AI search off'}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
            <Sparkles size={16} style={{ color: aiEnabled ? 'var(--mui-palette-primary-main, #1976d2)' : 'var(--text-secondary)' }} />
            <Switch
              checked={aiEnabled}
              onChange={handleAiToggle}
              size="small"
            />
          </Box>
        </Tooltip>
      </Box>

      {/* Fetching indicator */}
      <Box sx={{ height: 4, mb: 1 }}>
        {isBackgroundFetching && <LinearProgress sx={{ borderRadius: 1 }} />}
      </Box>

      {/* Folder category filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {folderData.map((folder) => {
          const selected = selectedFolders.has(folder.id);
          return (
            <Chip
              key={folder.id}
              label={folder.name}
              size="small"
              variant={selected ? 'filled' : 'outlined'}
              color={selected ? 'primary' : 'default'}
              onClick={() => toggleFolder(folder.id)}
              sx={{ cursor: 'pointer' }}
            />
          );
        })}
      </Box>

      {/* Result count */}
      {!isLoading && total > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {aiEnabled && aiSearchQuery
            ? `${total} result${total !== 1 ? 's' : ''} for "${aiSearchQuery}"`
            : debouncedQuery && !aiEnabled
              ? `${total} result${total !== 1 ? 's' : ''} for "${debouncedQuery}"`
              : `${total} document${total !== 1 ? 's' : ''}`}
        </Typography>
      )}

      {/* Loading state — first load only */}
      {isLoading && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 2,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
              <Skeleton variant="rectangular" height={160} />
              <Box sx={{ p: 1.5 }}>
                <Skeleton width="80%" height={20} sx={{ mb: 0.5 }} />
                <Skeleton width="100%" height={14} />
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={14} sx={{ mt: 1 }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && results.length === 0 && (
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
            {(aiEnabled && aiSearchQuery) || (!aiEnabled && debouncedQuery)
              ? 'No results found'
              : 'No documents yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {aiEnabled && aiSearchQuery
              ? `No documents match "${aiSearchQuery}"`
              : !aiEnabled && debouncedQuery
                ? `No documents match "${debouncedQuery}"`
                : 'Upload documents to see them here'}
          </Typography>
        </Box>
      )}

      {/* Results grid */}
      {!isLoading && results.length > 0 && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 2,
              flex: 1,
              opacity: isBackgroundFetching ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {results.map((doc) => (
              <Box
                key={doc.id}
                component="a"
                href={doc.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  },
                }}
              >
                {/* Thumbnail / icon area */}
                <Box
                  sx={{
                    height: 160,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {doc.mimeType.startsWith('image/') ? (
                    <Box
                      component="img"
                      src={doc.blobUrl}
                      alt={doc.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    getFileIcon(doc.mimeType)
                  )}
                </Box>

                {/* Card body */}
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.name}
                  </Typography>

                  {doc.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      {doc.description}
                    </Typography>
                  )}

                  {doc.tags && doc.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {doc.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      ))}
                      {doc.tags.length > 3 && (
                        <Chip
                          label={`+${doc.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  )}

                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', mt: 0.5 }}
                  >
                    {formatFileSize(doc.size)} &middot;{' '}
                    {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
