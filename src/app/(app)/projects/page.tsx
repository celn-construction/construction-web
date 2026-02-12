'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { Box, Typography, Stack, Divider, Card } from '@mui/material';
import ProjectsTree, { type Selection } from '@/components/projects/ProjectsTree';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';
import { useGroupedFeaturesWithRows, useGroups } from '@/store/hooks/useGanttFeatures';

export default function ProjectsPage() {
  const groups = useGroups();
  const { flatList } = useGroupedFeaturesWithRows();
  const [selection, setSelection] = useState<Selection | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const SIDEBAR_MIN = 200;
  const SIDEBAR_MAX = 600;

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          boxShadow: 1,
        }}
      >
        {/* Header */}
        <Box
          component={motion.div}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <LayoutGrid size={20} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.primary',
                }}
              >
                Construction Phases
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontSize: '0.625rem',
                }}
              >
                {groups.length} PHASES • {flatList.length} TASKS
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Split View: Tree + Detail Panel */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          sx={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Tree Pane */}
          <Box
            sx={{
              width: { xs: '100%', lg: sidebarWidth },
              display: { xs: selection ? 'none' : 'block', lg: 'block' },
              flexShrink: 0,
              overflow: 'auto',
              p: 3,
            }}
          >
            <ProjectsTree selectedNodeId={selection?.nodeId || null} onSelect={setSelection} />
          </Box>

          {/* Drag Handle - Desktop Only */}
          <Box
            sx={{
              width: 0,
              position: 'relative',
              display: { xs: 'none', lg: 'flex' },
            }}
          >
            <Box
              onMouseDown={onDragHandleMouseDown}
              sx={{
                position: 'absolute',
                insetY: 0,
                left: -4,
                width: 8,
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover .drag-line': {
                  bgcolor: 'text.primary',
                },
              }}
            >
              <Box
                className="drag-line"
                sx={{
                  width: '1px',
                  height: '100%',
                  bgcolor: 'divider',
                  transition: 'background-color 0.2s',
                }}
              />
            </Box>
          </Box>

          {/* Detail Panel */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              bgcolor: 'background.paper',
              display: { xs: selection ? 'block' : 'none', lg: 'block' },
            }}
          >
            <ProjectDetailPanel selection={selection} onBack={() => setSelection(null)} />
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
