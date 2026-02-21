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
} from '@mui/material';
import { Search, FileText, FileSpreadsheet, FileImage } from 'lucide-react';
import { format } from 'date-fns';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '@/trpc/react';
import { useProjectContext } from '@/components/providers/ProjectProvider';

const LIMIT = 20;

function getFileIcon(mimeType: string) {
  const iconStyle = { color: 'var(--text-secondary)' };
  if (mimeType.startsWith('image/')) return <FileImage size={32} style={iconStyle} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
    return <FileSpreadsheet size={32} style={iconStyle} />;
  return <FileText size={32} style={iconStyle} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentExplorerPage() {
  const { projectId, organizationId } = useProjectContext();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const offset = (page - 1) * LIMIT;

  const { data, isLoading, isFetching } = api.document.search.useQuery(
    {
      organizationId,
      projectId,
      query: debouncedQuery,
      limit: LIMIT,
      offset,
    },
    {
      enabled: !!organizationId && !!projectId,
      placeholderData: keepPreviousData,
    },
  );

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const isBackgroundFetching = isFetching && !isLoading;

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search bar */}
      <TextField
        placeholder="Search documents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 0.5 }}
      />

      {/* Fetching indicator */}
      <Box sx={{ height: 4, mb: 1 }}>
        {isBackgroundFetching && <LinearProgress sx={{ borderRadius: 1 }} />}
      </Box>

      {/* Result count */}
      {!isLoading && total > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {debouncedQuery
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
            {debouncedQuery ? 'No results found' : 'No documents yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {debouncedQuery
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
