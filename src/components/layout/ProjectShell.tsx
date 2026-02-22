'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import FilesContent from '@/components/files/FilesContent';

const BryntumGanttWrapper = dynamic(
  () => import('@/components/bryntum/BryntumGanttWrapper'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <CircularProgress size={24} />
      </Box>
    ),
  }
);

interface ProjectShellProps {
  children: ReactNode;
  projectId: string;
  projectName: string;
}

export default function ProjectShell({ children, projectId, projectName }: ProjectShellProps) {
  const pathname = usePathname();
  const isGanttRoute = pathname.endsWith('/gantt');
  const isFilesRoute = pathname.endsWith('/files');
  const [ganttMounted, setGanttMounted] = useState(false);
  const [filesMounted, setFilesMounted] = useState(false);

  // Lazy-mount each tab on first visit — avoids loading heavy bundles until needed
  useEffect(() => {
    if (isGanttRoute && !ganttMounted) {
      setGanttMounted(true);
    }
    if (isFilesRoute && !filesMounted) {
      setFilesMounted(true);
    }
  }, [isGanttRoute, isFilesRoute, ganttMounted, filesMounted]);

  return (
    <>
      {/* Gantt tab — kept alive after first visit */}
      {ganttMounted && (
        <Box
          sx={{
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'clip',
            width: '100%',
            p: 3,
            display: isGanttRoute ? 'flex' : 'none',
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <BryntumGanttWrapper projectId={projectId} isVisible={isGanttRoute} />
          </Box>
        </Box>
      )}

      {/* Files tab — kept alive after first visit */}
      {filesMounted && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: isFilesRoute ? 'flex' : 'none',
          }}
        >
          <FilesContent />
        </Box>
      )}

      {/* Other pages render normally via Next.js routing */}
      {children}
    </>
  );
}
