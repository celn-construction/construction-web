'use client';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Download, SquareCheck, CircleDashed } from 'lucide-react';
import { format } from 'date-fns';
import { getFileIcon } from '@/lib/utils/files';
import { formatFileSize } from '@/lib/utils/formatting';
import CategoryBadge from './CategoryBadge';
import type { DocumentResult } from './types';

interface DocumentTableProps {
  docs: DocumentResult[];
}

export default function DocumentTable({ docs }: DocumentTableProps) {
  const theme = useTheme();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Linked Task</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date Added</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Size</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docs.map((doc) => (
            <TableRow
              key={doc.id}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getFileIcon(doc.mimeType)}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <CategoryBadge folderId={doc.folderId} />
              </TableCell>
              <TableCell>
                {doc.taskId ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SquareCheck size={12} style={{ color: theme.palette.success.main }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'success.main' }}>
                      Linked
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CircleDashed size={12} style={{ color: theme.palette.text.secondary }} />
                    <Typography sx={{ fontSize: 11, fontStyle: 'italic', color: 'text.disabled' }}>
                      No task
                    </Typography>
                  </Box>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatFileSize(doc.size)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    component="a"
                    href={doc.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={16} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
