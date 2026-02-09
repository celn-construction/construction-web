'use client';

// Gantt staging zone with Quick Add and drag-to-schedule functionality

import { useState, useCallback, useRef } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { addDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFeatureActions, useGroups, useStatuses } from '@/store/hooks';
import type { GanttFeature, GanttStatus } from '@/components/gantt/document-modal/gantt-types';

interface StagedTask {
  id: string;
  name: string;
  status: GanttStatus;
}

interface GanttQuickAddToolbarProps {
  taskCount: number;
  onTaskCreated?: (task: GanttFeature) => void;
  children: React.ReactNode;
}

// Draggable staged task chip
function StagedTaskChip({
  task,
  onRemove,
}: {
  task: StagedTask;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'staged', task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs',
        'border border-dashed border-blue-300 dark:border-blue-600',
        'bg-white dark:bg-blue-900/40',
        'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50',
        'shadow-sm group',
        isDragging && 'opacity-40 scale-95',
        !isDragging && 'cursor-grab active:cursor-grabbing'
      )}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3 w-3 flex-shrink-0 text-blue-400" />
      <span className="text-blue-700 dark:text-blue-300 truncate max-w-[120px] font-medium">
        {task.name}
      </span>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(task.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors opacity-0 group-hover:opacity-100"
        title="Remove"
      >
        <X className="h-3 w-3 text-red-500" />
      </button>
    </motion.div>
  );
}

// Drop zone overlay for the chart
function ChartDropZone({
  children,
  isOver,
}: {
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: 'gantt-chart-drop-zone',
  });

  return (
    <div ref={setNodeRef} className="relative flex-1">
      {children}

      {/* Drop indicator overlay */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none z-10 flex items-center justify-center"
          >
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              Drop to schedule task (starts today)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Drag overlay
function DragOverlayContent({ task }: { task: StagedTask | null }) {
  if (!task) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border-2 border-blue-500 bg-blue-50 dark:bg-blue-900 shadow-2xl cursor-grabbing">
      <GripVertical className="h-3 w-3 flex-shrink-0 text-blue-600" />
      <span className="text-blue-800 dark:text-blue-200 font-medium">{task.name}</span>
    </div>
  );
}

export function SVARQuickAddToolbar({ taskCount, onTaskCreated, children }: GanttQuickAddToolbarProps) {
  const { add: addFeature } = useFeatureActions();
  const groups = useGroups();
  const statuses = useStatuses();

  const [stagedTasks, setStagedTasks] = useState<StagedTask[]>([]);
  const [nextNumber, setNextNumber] = useState(1000);
  const [activeDragTask, setActiveDragTask] = useState<StagedTask | null>(null);
  const [isOverDropZone, setIsOverDropZone] = useState(false);

  const selectedGroup = groups[0] ?? 'Foundation & Site Work';
  const defaultStatus = statuses['planned'] ?? { id: 'planned', name: 'Planned', color: '#6b7280' };

  // Quick Add - creates a staged task chip
  const handleQuickAdd = useCallback(() => {
    const newTask: StagedTask = {
      id: `staged-${Date.now()}`,
      name: `New #${nextNumber}`,
      status: defaultStatus,
    };
    setStagedTasks(prev => [...prev, newTask]);
    setNextNumber(prev => prev + 1);
  }, [nextNumber, defaultStatus]);

  // Remove staged task
  const handleRemove = useCallback((id: string) => {
    setStagedTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Schedule a staged task at today's date
  const handleSchedule = useCallback((task: StagedTask) => {
    const start = startOfDay(new Date());

    const newFeature: GanttFeature = {
      id: `task-${Date.now()}`,
      name: task.name,
      group: selectedGroup,
      status: task.status,
      startAt: start,
      endAt: addDays(start, 7),
      progress: 0,
    };

    addFeature(newFeature);
    setStagedTasks(prev => prev.filter(t => t.id !== task.id));
    onTaskCreated?.(newFeature);

    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    toast.success(`Scheduled "${task.name}"`, {
      description: `Added to ${selectedGroup} • Starts ${dateStr}`,
    });
  }, [selectedGroup, addFeature, onTaskCreated]);

  // Handle drag events
  const handleDragStart = useCallback((event: { active: { data: { current?: { task?: StagedTask } } } }) => {
    const task = event.active.data.current?.task;
    setActiveDragTask(task ?? null);
  }, []);

  const handleDragOver = useCallback((event: { over: { id: string | number } | null }) => {
    const over = event.over?.id === 'gantt-chart-drop-zone';
    setIsOverDropZone(over);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;

    setActiveDragTask(null);
    setIsOverDropZone(false);

    // If dropped on the chart, schedule the task at today's date
    if (over?.id === 'gantt-chart-drop-zone' && activeDragTask) {
      handleSchedule(activeDragTask);
    }
  }, [activeDragTask, handleSchedule]);

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col flex-1">
        {/* Staging zone toolbar */}
        <div
          data-staging-zone
          className={cn(
            'flex items-center gap-3 px-4 py-2.5',
            'bg-gradient-to-r from-blue-50/80 to-blue-50/40 dark:from-blue-950/40 dark:to-blue-950/20',
            'border border-blue-200/60 dark:border-blue-800/60',
            'border-b-2 border-b-dashed border-b-blue-300 dark:border-b-blue-700',
            'rounded-t-xl'
          )}
        >
          {/* Quick Add button */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-3 gap-1.5',
              'border-blue-300 dark:border-blue-600',
              'text-blue-600 dark:text-blue-400',
              'bg-white/80 dark:bg-blue-900/30',
              'hover:bg-blue-100 dark:hover:bg-blue-900/50',
              'hover:border-blue-400 dark:hover:border-blue-500',
              'rounded-lg shadow-sm flex-shrink-0'
            )}
            onClick={handleQuickAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Quick Add</span>
          </Button>

          {/* Divider */}
          <div className="h-5 w-px bg-blue-200/80 dark:bg-blue-700/50 rounded-full flex-shrink-0" />

          {/* Staged tasks */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-0.5">
            <AnimatePresence mode="popLayout">
              {stagedTasks.map((task) => (
                <StagedTaskChip
                  key={task.id}
                  task={task}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>

            {/* Empty state hint */}
            {stagedTasks.length === 0 && (
              <motion.span
                className="text-xs text-blue-400/80 dark:text-blue-500/80 whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Click &quot;Quick Add&quot; then drag task to a date on the chart
              </motion.span>
            )}
          </div>
        </div>

        {/* Chart with drop zone */}
        <div>
          <ChartDropZone isOver={isOverDropZone}>
            {children}
          </ChartDropZone>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        <DragOverlayContent task={activeDragTask} />
      </DragOverlay>
    </DndContext>
  );
}

export default SVARQuickAddToolbar;
