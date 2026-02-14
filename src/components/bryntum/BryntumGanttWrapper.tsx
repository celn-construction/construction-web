'use client';

import { useMemo, type CSSProperties } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.css';
import { useThemeStore } from '~/store/useThemeStore';
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
  const { selectedTask, popoverPlacement, handleTaskClick, closeTaskPopover, isTaskPopoverOpen } =
    useTaskPopover();

  useBryntumThemeAssets(theme);

  const ganttConfig = useMemo(
    () => createGanttConfig(handleTaskClick, projectId),
    [handleTaskClick, projectId]
  );

  return (
    <div style={WRAPPER_STYLE}>
      <BryntumPanelHeader title="Bryntum Schedule" />

      <div style={GANTT_CONTENT_STYLE} className="bryntum-gantt-container">
        <BryntumGantt {...ganttConfig} />
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
