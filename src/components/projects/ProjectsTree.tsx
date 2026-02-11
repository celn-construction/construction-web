'use client';

import { Folder, FileText } from 'lucide-react';
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
import { useGroupedFeaturesWithRows, useGroups, useCurrentProjectId } from '@/store/hooks/useGanttFeatures';
import type { GanttFeature } from '@/types/gantt-types';
import { api } from '@/trpc/react';

// Static construction document folder structure (same for every task)
export const folderData = [
  {
    id: 'rfi',
    name: 'RFI',
    isLeaf: true,
  },
  {
    id: 'submittals',
    name: 'Submittals',
    isLeaf: false,
    children: [
      { id: 'submittals-product', name: 'Product Data' },
      { id: 'submittals-shop', name: 'Shop Drawings' },
      { id: 'submittals-certs', name: 'Certs' },
    ],
  },
  {
    id: 'change-orders',
    name: 'Change Orders',
    isLeaf: true,
  },
  {
    id: 'photos',
    name: 'Photos',
    isLeaf: true,
  },
  {
    id: 'inspections',
    name: 'Inspections',
    isLeaf: false,
    children: [
      { id: 'inspections-structural', name: 'Structural' },
      { id: 'inspections-mep', name: 'MEP' },
      { id: 'inspections-safety', name: 'Safety' },
    ],
  },
];

export interface Selection {
  type: 'task' | 'folder';
  nodeId: string;
  taskId: string;
  folderName?: string;
  parentFolderName?: string;
  folderId?: string;
}

interface ProjectsTreeProps {
  selectedNodeId: string | null;
  onSelect: (selection: Selection | null) => void;
}

// Component to display folder with document count badge
interface FolderNodeProps {
  folder: typeof folderData[0];
  taskId: string;
  projectId: string | null;
  organizationId: string | undefined;
  groupIndex: number;
  isLastTask: boolean;
  folderIndex: number;
  isLastFolder: boolean;
  groupsLength: number;
}

function FolderNode({
  folder,
  taskId,
  projectId,
  organizationId,
  groupIndex,
  isLastTask,
  folderIndex,
  isLastFolder,
  groupsLength,
}: FolderNodeProps) {
  const folderId = `${taskId}-${folder.id}`;

  // Get document counts for this task
  const { data: counts } = api.document.countByTask.useQuery(
    {
      organizationId: organizationId!,
      projectId: projectId!,
      taskId: taskId.replace('task-', ''),
    },
    {
      enabled: !!organizationId && !!projectId,
    }
  );

  const documentCount = counts?.[folder.id] || 0;

  return (
    <TreeNode
      key={folderId}
      nodeId={folderId}
      isLast={isLastFolder}
      level={2}
      parentPath={[groupIndex === groupsLength - 1, isLastTask]}
    >
      <TreeNodeTrigger>
        <TreeExpander hasChildren={!folder.isLeaf} />
        <TreeIcon hasChildren={!folder.isLeaf} icon={<Folder className="w-4 h-4 text-amber-500" />} />
        <TreeLabel className="font-medium">
          <div className="flex items-center gap-2">
            <span>{folder.name}</span>
            {documentCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                {documentCount}
              </span>
            )}
          </div>
        </TreeLabel>
      </TreeNodeTrigger>
      {!folder.isLeaf && folder.children && (
        <TreeNodeContent hasChildren={true}>
          {folder.children.map((child, childIndex) => {
            const childId = `${folderId}-${child.id}`;
            const isLastChild = childIndex === folder.children!.length - 1;
            const childDocCount = counts?.[child.id] || 0;

            return (
              <TreeNode
                key={childId}
                nodeId={childId}
                isLast={isLastChild}
                level={3}
                parentPath={[groupIndex === groupsLength - 1, isLastTask, isLastFolder]}
              >
                <TreeNodeTrigger>
                  <TreeExpander hasChildren={false} />
                  <TreeIcon hasChildren={false} icon={<FileText className="w-4 h-4 text-gray-500" />} />
                  <TreeLabel>
                    <div className="flex items-center gap-2">
                      <span>{child.name}</span>
                      {childDocCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full font-medium">
                          {childDocCount}
                        </span>
                      )}
                    </div>
                  </TreeLabel>
                </TreeNodeTrigger>
              </TreeNode>
            );
          })}
        </TreeNodeContent>
      )}
    </TreeNode>
  );
}

export default function ProjectsTree({ selectedNodeId, onSelect }: ProjectsTreeProps) {
  const groups = useGroups();
  const { grouped } = useGroupedFeaturesWithRows();
  const currentProjectId = useCurrentProjectId();

  // Get project to access organizationId
  const { data: projects = [] } = api.project.list.useQuery();
  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Get all group IDs for default expansion
  const defaultExpandedIds = groups.map((group) => `group-${group}`);

  // Handle selection change
  const handleSelectionChange = (selectedIds: string[]) => {
    const nodeId = selectedIds[0];
    if (!nodeId) {
      onSelect(null);
      return;
    }

    // Ignore group selections
    if (nodeId.startsWith('group-')) {
      onSelect(null);
      return;
    }

    // Parse task selection: task-{featureId}
    if (nodeId.startsWith('task-') && !nodeId.includes('-', 5)) {
      const taskId = nodeId.substring(5);
      onSelect({
        type: 'task',
        nodeId,
        taskId,
      });
      return;
    }

    // Parse folder selection: task-{featureId}-{folderId} or task-{featureId}-{folderId}-{childId}
    const parts = nodeId.split('-');
    if (parts.length >= 3 && parts[0] === 'task' && parts[1] && parts[2]) {
      const taskId = parts[1];
      const folderId = parts[2];

      // Find folder name
      let folderName: string;
      let parentFolderName: string | undefined;

      let actualFolderId: string;

      if (parts.length === 3) {
        // Top-level folder
        const folder = folderData.find((f) => f.id === folderId);
        folderName = folder?.name ?? folderId;
        actualFolderId = folderId;
      } else if (parts.length === 4 && parts[3]) {
        // Sub-folder
        const childId = parts[3];
        const parentFolder = folderData.find((f) => f.id === folderId);
        const childFolder = parentFolder?.children?.find((c) => c.id === childId);
        folderName = childFolder?.name ?? childId;
        parentFolderName = parentFolder?.name;
        actualFolderId = childId;
      } else {
        // Fallback
        folderName = folderId;
        actualFolderId = folderId;
      }

      onSelect({
        type: 'folder',
        nodeId,
        taskId,
        folderName,
        parentFolderName,
        folderId: actualFolderId,
      });
      return;
    }

    onSelect(null);
  };

  return (
    <TreeProvider
      defaultExpandedIds={defaultExpandedIds}
      showLines={true}
      showIcons={true}
      selectable={true}
      selectedIds={selectedNodeId ? [selectedNodeId] : []}
      onSelectionChange={handleSelectionChange}
    >
      <TreeView className="w-full">
        {groups.map((groupName, groupIndex) => {
          const tasks = grouped[groupName] || [];
          const groupId = `group-${groupName}`;

          return (
            <TreeNode key={groupId} nodeId={groupId} isLast={groupIndex === groups.length - 1}>
              <TreeNodeTrigger>
                <TreeExpander hasChildren={true} />
                <TreeIcon hasChildren={true} icon={<Folder className="w-4 h-4" />} />
                <TreeLabel>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{groupName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                </TreeLabel>
              </TreeNodeTrigger>
              <TreeNodeContent hasChildren={true}>
                {tasks.map((task, taskIndex) => {
                  const taskId = `task-${task.id}`;
                  const isLastTask = taskIndex === tasks.length - 1;

                  return (
                    <TreeNode
                      key={taskId}
                      nodeId={taskId}
                      isLast={isLastTask}
                      level={1}
                      parentPath={[groupIndex === groups.length - 1]}
                    >
                      <TreeNodeTrigger>
                        <TreeExpander hasChildren={true} />
                        <TreeIcon
                          hasChildren={true}
                          icon={
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: task.status.color }}
                            />
                          }
                        />
                        <TreeLabel className="overflow-hidden">
                          <div className="flex items-center justify-between flex-1 gap-4 min-w-0">
                            <span className="truncate">{task.name}</span>
                            <div className="flex items-center gap-3 text-xs shrink-0">
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
                      <TreeNodeContent hasChildren={true}>
                        {folderData.map((folder, folderIndex) => {
                          const isLastFolder = folderIndex === folderData.length - 1;

                          return (
                            <FolderNode
                              key={`${taskId}-${folder.id}`}
                              folder={folder}
                              taskId={taskId}
                              projectId={currentProjectId}
                              organizationId={currentProject?.organizationId}
                              groupIndex={groupIndex}
                              isLastTask={isLastTask}
                              folderIndex={folderIndex}
                              isLastFolder={isLastFolder}
                              groupsLength={groups.length}
                            />
                          );
                        })}
                      </TreeNodeContent>
                    </TreeNode>
                  );
                })}
              </TreeNodeContent>
            </TreeNode>
          );
        })}
      </TreeView>
    </TreeProvider>
  );
}
