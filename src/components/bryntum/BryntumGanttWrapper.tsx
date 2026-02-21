'use client';

import { useMemo, useState, useRef, useCallback, useEffect, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { CircularProgress, Box } from '@mui/material';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/trpc/react';
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
  overflow: 'clip',
};

const STALE_THRESHOLD_MS = 60_000; // 60 seconds

interface BryntumGanttWrapperProps {
  projectId?: string;
  isVisible?: boolean;
}

export default function BryntumGanttWrapper({ projectId, isVisible = true }: BryntumGanttWrapperProps) {
  const theme = useThemeStore((state) => state.theme);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ganttRef = useRef<BryntumGantt>(null);

  const { selectedTask, popoverPlacement, handleTaskClick, closeTaskPopover, isTaskPopoverOpen } =
    useTaskPopover();

  useBryntumThemeAssets(theme);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getGanttInstance = useCallback((): any => {
    return (ganttRef.current as unknown as { instance: unknown })?.instance;
  }, []);

  const handleAddTask = useCallback(async () => {
    const gantt = getGanttInstance();
    if (!gantt) return;
    gantt.taskStore.add({
      name: 'New Task',
      startDate: new Date(),
      duration: 1,
    });
    await gantt.project.commitAsync();
  }, [getGanttInstance]);

  const handleZoomIn = useCallback(() => getGanttInstance()?.zoomIn(), [getGanttInstance]);
  const handleZoomOut = useCallback(() => getGanttInstance()?.zoomOut(), [getGanttInstance]);
  const handleZoomToFit = useCallback(() => {
    getGanttInstance()?.zoomToFit({ leftMargin: 50, rightMargin: 50 });
  }, [getGanttInstance]);
  const handleShiftPrevious = useCallback(() => getGanttInstance()?.shiftPrevious(), [getGanttInstance]);
  const handleShiftNext = useCallback(() => getGanttInstance()?.shiftNext(), [getGanttInstance]);
  const handlePresetChange = useCallback((preset: string) => {
    const gantt = getGanttInstance();
    if (gantt) gantt.viewPreset = preset;
  }, [getGanttInstance]);

  // Invalidate tRPC cache when Bryntum syncs so sibling components (e.g. file tree) refetch
  const utils = api.useUtils();
  useEffect(() => {
    if (isLoading) return;
    const gantt = getGanttInstance();
    if (!gantt?.project) return;

    const onSync = () => {
      void utils.gantt.tasks.invalidate();
    };

    gantt.project.on('sync', onSync);
    return () => {
      gantt.project?.un('sync', onSync);
    };
  }, [isLoading, getGanttInstance, utils]);

  // Silently refresh data when returning to the Gantt tab after the stale threshold.
  // Bryntum's CrudManager merges fresh data without resetting scroll, selections, or expanded state.
  const hiddenSinceRef = useRef(0);
  useEffect(() => {
    if (isVisible) {
      const hiddenDuration = Date.now() - hiddenSinceRef.current;
      if (hiddenSinceRef.current > 0 && hiddenDuration > STALE_THRESHOLD_MS) {
        const gantt = getGanttInstance();
        if (gantt?.project) {
          gantt.project.load();
        }
      }
    } else {
      hiddenSinceRef.current = Date.now();
    }
  }, [isVisible, getGanttInstance]);

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
      <BryntumPanelHeader
        title="Bryntum Schedule"
        onAddTask={handleAddTask}
        onPresetChange={handlePresetChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomToFit={handleZoomToFit}
        onShiftPrevious={handleShiftPrevious}
        onShiftNext={handleShiftNext}
      />

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
        taskId={selectedTask?.id}
        popoverPlacement={popoverPlacement}
        onClose={closeTaskPopover}
      />
    </div>
  );
}
