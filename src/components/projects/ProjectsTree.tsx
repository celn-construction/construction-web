'use client';

import { useState } from 'react';
import { Folder } from 'lucide-react';
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from '@/components/kibo-ui/tree';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import FeatureFolderTree from '@/components/dashboard/FeatureFolderTree';
import { useGroupedFeaturesWithRows, useGroups } from '@/store/hooks/useGanttFeatures';
import { useUpdateFeature } from '@/store/hooks/useFeatureActions';
import type { GanttFeature } from '@/types/gantt-types';

type DocumentSelection = {
  id: string;
  name: string;
};

export default function ProjectsTree() {
  const groups = useGroups();
  const { grouped } = useGroupedFeaturesWithRows();
  const updateFeature = useUpdateFeature();

  const [selectedTask, setSelectedTask] = useState<GanttFeature | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentSelection | null>(null);

  // Get all group IDs for default expansion
  const defaultExpandedIds = groups.map((group) => `group-${group}`);

  const handleTaskClick = (task: GanttFeature) => {
    setSelectedTask(task);
  };

  const handleDocumentSelect = (docId: string, docName: string) => {
    setSelectedDoc({ id: docId, name: docName });
  };

  const handleCoverImageChange = (imageUrl: string | undefined) => {
    if (selectedTask) {
      updateFeature(selectedTask.id, { coverImage: imageUrl });
    }
  };

  const getStatusColor = (statusName: string): string => {
    const statusColors: Record<string, string> = {
      'Completed': '#10b981', // green-500
      'In Progress': '#3b82f6', // blue-500
      'Planned': '#6b7280', // gray-500
      'On Hold': '#f59e0b', // amber-500
      'Delayed': '#ef4444', // red-500
    };
    return statusColors[statusName] || '#6b7280';
  };

  return (
    <>
      <TreeProvider
        defaultExpandedIds={defaultExpandedIds}
        showLines={true}
        showIcons={true}
        selectable={false}
      >
        <TreeView className="w-full">
          {groups.map((groupName) => {
            const tasks = grouped[groupName] || [];
            const groupId = `group-${groupName}`;

            return (
              <TreeNode key={groupId} nodeId={groupId} isLast={false}>
                <TreeNodeTrigger>
                  <TreeExpander />
                  <TreeIcon>
                    <Folder className="w-4 h-4" />
                  </TreeIcon>
                  <TreeLabel>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{groupName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                  </TreeLabel>
                </TreeNodeTrigger>
                <TreeNodeContent>
                  {tasks.map((task, index) => {
                    const taskId = `task-${task.id}`;
                    const isLastTask = index === tasks.length - 1;

                    return (
                      <TreeNode key={taskId} nodeId={taskId} isLast={isLastTask}>
                        <TreeNodeTrigger
                          onClick={() => handleTaskClick(task)}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                          <TreeIcon>
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: task.status.color }}
                            />
                          </TreeIcon>
                          <TreeLabel>
                            <div className="flex items-center justify-between flex-1 gap-4">
                              <span>{task.name}</span>
                              <div className="flex items-center gap-3 text-xs">
                                {task.progress !== undefined && (
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {task.progress}%
                                  </span>
                                )}
                                <span
                                  className="font-medium"
                                  style={{ color: task.status.color }}
                                >
                                  {task.status.name}
                                </span>
                              </div>
                            </div>
                          </TreeLabel>
                        </TreeNodeTrigger>
                      </TreeNode>
                    );
                  })}
                </TreeNodeContent>
              </TreeNode>
            );
          })}
        </TreeView>
      </TreeProvider>

      {/* Task Detail Sheet */}
      <Sheet
        modal={false}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setSelectedDoc(null);
          }
        }}
      >
        <SheetContent overlay={false} className="w-96">
          {selectedTask && (
            <FeatureFolderTree
              featureName={selectedTask.name}
              featureId={selectedTask.id}
              coverImage={selectedTask.coverImage}
              onCoverImageChange={handleCoverImageChange}
              onDocumentSelect={handleDocumentSelect}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Document Detail Sheet (nested) */}
      <Sheet
        modal={false}
        open={!!selectedDoc}
        onOpenChange={(open) => {
          if (!open) setSelectedDoc(null);
        }}
      >
        <SheetContent overlay={false}>
          <SheetHeader>
            <SheetTitle>{selectedDoc?.name}</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}
