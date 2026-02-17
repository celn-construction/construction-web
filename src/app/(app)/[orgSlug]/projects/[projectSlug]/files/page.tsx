'use client';

import { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import ProjectsTree, { type Selection } from '@/components/projects/ProjectsTree';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';

export default function FilesPage() {
  const { projectId, organizationId } = useProjectContext();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [treeWidth, setTreeWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 200), 500);
      setTreeWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Left Panel - Tree */}
      <Box
        sx={{
          width: { xs: selection ? 0 : '100%', lg: treeWidth },
          flexShrink: 0,
          overflow: 'auto',
          display: { xs: selection ? 'none' : 'block', lg: 'block' },
        }}
      >
        <ProjectsTree
          selectedNodeId={selection?.nodeId ?? null}
          onSelect={setSelection}
          projectId={projectId}
          organizationId={organizationId}
        />
      </Box>

      {/* Draggable Divider */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: 4,
          flexShrink: 0,
          cursor: 'col-resize',
          bgcolor: isDragging ? 'primary.main' : 'divider',
          transition: isDragging ? 'none' : 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'primary.main',
          },
        }}
      />

      {/* Right Panel - Detail */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: { xs: selection ? 'block' : 'none', lg: 'block' },
        }}
      >
        <ProjectDetailPanel
          selection={selection}
          onBack={() => setSelection(null)}
          projectId={projectId}
          organizationId={organizationId}
        />
      </Box>
    </Box>
  );
}
