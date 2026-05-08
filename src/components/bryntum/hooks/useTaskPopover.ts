'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PopoverPlacement, SelectedTask, TaskClickEventPayload } from '../types';
import {
  calculatePopoverPlacement,
  createFallbackPopoverPlacement,
} from '../utils/calculatePopoverPlacement';
import { useSnackbar } from '@/hooks/useSnackbar';

function findTaskBarElement(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('.b-gantt-task');
}

export function useTaskPopover() {
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<PopoverPlacement | null>(null);
  const { showSnackbar } = useSnackbar();

  const selectedTaskIdRef = useRef<string | null>(null);
  const highlightedElementRef = useRef<Element | null>(null);

  useEffect(() => {
    selectedTaskIdRef.current = selectedTask?.id ?? null;
  }, [selectedTask?.id]);

  const clearHighlight = useCallback(() => {
    highlightedElementRef.current?.classList.remove('b-task-selected');
    highlightedElementRef.current = null;
  }, []);

  const closeTaskPopover = useCallback(() => {
    clearHighlight();
    setSelectedTask(null);
    setPopoverPlacement(null);
  }, [clearHighlight]);

  const handleTaskClick = useCallback(
    ({ taskRecord, event }: TaskClickEventPayload) => {
      // Only open the popover for leaf tasks — parent task bars just navigate the chart
      if (taskRecord.isParent) return;

      // Bryntum-generated phantom IDs (newly added tasks not yet synced) don't
      // exist in the DB, so popover mutations like updateRequirement /
      // updateCsiCode / pinPhoto would throw NOT_FOUND. Tell the user to save
      // a snapshot first instead of opening a popover that can't save.
      if (taskRecord.isPhantom) {
        showSnackbar('Save a snapshot to edit this task', 'info');
        return;
      }

      const taskId = String(taskRecord.id);

      if (selectedTaskIdRef.current === taskId) {
        closeTaskPopover();
        return;
      }

      setSelectedTask({
        id: taskId,
        name: taskRecord.name ?? '',
      });

      const taskBarElement = findTaskBarElement(event.target);

      // Move highlight to the new task bar
      clearHighlight();
      if (taskBarElement) {
        taskBarElement.classList.add('b-task-selected');
        highlightedElementRef.current = taskBarElement;

        setPopoverPlacement(
          calculatePopoverPlacement({
            rect: taskBarElement.getBoundingClientRect(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          })
        );
        return;
      }

      setPopoverPlacement(createFallbackPopoverPlacement(event.clientX, event.clientY));
    },
    [clearHighlight, closeTaskPopover, showSnackbar]
  );

  return {
    selectedTask,
    popoverPlacement,
    isTaskPopoverOpen: selectedTask !== null && popoverPlacement !== null,
    handleTaskClick,
    closeTaskPopover,
  };
}
