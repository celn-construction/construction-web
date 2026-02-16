'use client';

import { useMemo, useState, useRef, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { CircularProgress, Box } from '@mui/material';
import { useThemeStore } from '@/store/useThemeStore';
import { createGanttConfig } from './config/ganttConfig';
import { BryntumPanelHeader } from './components/BryntumPanelHeader';
import { TaskDetailsPopover } from './components/TaskDetailsPopover';
import { useBryntumThemeAssets } from './hooks/useBryntumThemeAssets';
import { useTaskPopover } from './hooks/useTaskPopover';

const WRAPPER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-card)',
};

const GANTT_CONTENT_STYLE: CSSProperties = {
  flex: 1,
  overflow: 'hidden',
};

interface BryntumGanttWrapperProps {
  projectId?: string;
}

export default function BryntumGanttWrapper({ projectId }: BryntumGanttWrapperProps) {
  const theme = useThemeStore((state) => state.theme);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ganttRef = useRef<BryntumGantt>(null);

  const { selectedTask, popoverPlacement, handleTaskClick, closeTaskPopover, isTaskPopoverOpen } =
    useTaskPopover();

  useBryntumThemeAssets(theme);

  const ganttConfig = useMemo(
    () => createGanttConfig(handleTaskClick, projectId, {
      onLoadStart: () => {
        setIsLoading(true);
        setLoadError(null);
      },
      onLoadComplete: () => {
        setIsLoading(false);
      },
      onLoadError: (error: string) => {
        setIsLoading(false);
        setLoadError(error);
      },
    }),
    [handleTaskClick, projectId]
  );

  return (
    <div style={WRAPPER_STYLE}>
      <BryntumPanelHeader title="Bryntum Schedule" />

      <div style={GANTT_CONTENT_STYLE} className="bryntum-gantt-container">
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <div>Loading Gantt chart data...</div>
          </Box>
        )}

        {loadError && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
              color: 'error.main',
            }}
          >
            <div>Failed to load Gantt chart</div>
            <div style={{ fontSize: '0.875rem' }}>{loadError}</div>
          </Box>
        )}

        <div style={{
          display: isLoading || loadError ? 'none' : 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}>
          <BryntumGantt ref={ganttRef} {...ganttConfig} />
        </div>
      </div>

      <TaskDetailsPopover
        open={isTaskPopoverOpen}
        taskName={selectedTask?.name ?? ''}
        popoverPlacement={popoverPlacement}
        onClose={closeTaskPopover}
      />
    </div>
  );
}
