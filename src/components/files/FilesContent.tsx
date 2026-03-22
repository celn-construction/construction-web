'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import ProjectsTree, { type Selection } from '@/components/projects/ProjectsTree';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';

export default function FilesContent() {
  const { projectId, organizationId } = useProjectContext();
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel - Tree */}
      <Box
        sx={{
          width: { xs: 220, sm: 280, lg: 320 },
          flexShrink: 0,
          overflow: 'auto',
        }}
      >
        <ProjectsTree
          selectedNodeId={selection?.nodeId ?? null}
          onSelect={setSelection}
          projectId={projectId}
          organizationId={organizationId}
        />
      </Box>

      {/* Divider */}
      <Box
        sx={{
          width: '1px',
          flexShrink: 0,
          bgcolor: 'divider',
        }}
      />

      {/* Right Panel - Detail */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          overflow: 'auto',
        }}
      >
        <ProjectDetailPanel
          selection={selection}
          projectId={projectId}
          organizationId={organizationId}
        />
      </Box>
    </Box>
  );
}
