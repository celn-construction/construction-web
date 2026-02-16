'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import ProjectsTree, { type Selection } from '@/components/projects/ProjectsTree';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';

export default function FilesPage() {
  const { projectId, organizationId } = useProjectContext();
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel - Tree */}
      <Box
        sx={{
          width: { xs: selection ? 0 : '100%', lg: 320 },
          flexShrink: 0,
          borderRight: { xs: 'none', lg: '1px solid' },
          borderColor: 'divider',
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
        />
      </Box>
    </Box>
  );
}
