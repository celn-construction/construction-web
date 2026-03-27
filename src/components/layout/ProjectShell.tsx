'use client';

import { useState, useEffect, useRef, type ReactNode, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import FilesContent from '@/components/files/FilesContent';
import GanttLoadingSpinner from '@/components/bryntum/components/GanttLoadingSpinner';
import type { default as BryntumGanttWrapperType } from '@/components/bryntum/BryntumGanttWrapper';

// Manual client-only import — avoids next/dynamic which causes double-mounts
// that corrupt Bryntum's rendering pipeline.
function useClientComponent() {
  const [Component, setComponent] = useState<ComponentType<React.ComponentProps<typeof BryntumGanttWrapperType>> | null>(null);
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void import('@/components/bryntum/BryntumGanttWrapper').then(mod => {
      setComponent(() => mod.default);
    });
  }, []);
  return Component;
}


interface ProjectShellProps {
  children: ReactNode;
  projectId: string;
  projectName: string;
  userId?: string;
  userName?: string;
  userImage?: string;
  realtimeEnabled?: boolean;
}

export default function ProjectShell({ children, projectId, projectName, userId, userName, userImage, realtimeEnabled }: ProjectShellProps) {
  const pathname = usePathname();
  const isGanttRoute = pathname.endsWith('/gantt');
  const isFilesRoute = pathname.endsWith('/files');
  const [ganttMounted, setGanttMounted] = useState(false);
  const [filesMounted, setFilesMounted] = useState(false);
  const BryntumGanttWrapper = useClientComponent();

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
            overflow: 'hidden',
            width: '100%',
            p: 3,
            display: isGanttRoute ? 'flex' : 'none',
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {BryntumGanttWrapper ? (
              <BryntumGanttWrapper
                projectId={projectId}
                isVisible={isGanttRoute}
                userId={userId}
                userName={userName}
                userAvatar={userImage}
                realtimeEnabled={false}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <GanttLoadingSpinner />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Files tab — kept alive after first visit */}
      {filesMounted && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
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
