'use client';

import { useState, Fragment, useMemo } from 'react';
import { Folder, FileText, Plus } from 'lucide-react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box, Chip, IconButton } from '@mui/material';
import { api } from '@/trpc/react';
import UploadDialog from '@/components/documents/UploadDialog';

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
  projectId?: string;
  organizationId?: string;
}

// Component to display folder with document count badge
interface FolderNodeProps {
  folder: typeof folderData[0];
  taskId: string;
  projectId: string | null;
  organizationId: string | undefined;
}

function FolderNode({ folder, taskId, projectId, organizationId }: FolderNodeProps) {
  const folderId = `${taskId}-${folder.id}`;
  const utils = api.useUtils();
  const [uploadOpen, setUploadOpen] = useState(false);

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

  const handleUploadComplete = () => {
    if (organizationId && projectId) {
      void utils.document.countByTask.invalidate({
        organizationId,
        projectId,
        taskId: taskId.replace('task-', ''),
      });
      void utils.document.listByFolder.invalidate();
    }
  };

  return (
    <Fragment>
      <TreeItem
      key={folderId}
      itemId={folderId}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          <Folder size={14} style={{ color: '#f59e0b' }} />
          <Box sx={{ fontWeight: 500, flexGrow: 1 }}>{folder.name}</Box>
          {documentCount > 0 && (
            <Chip
              label={documentCount}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: 'warning.light',
                color: 'warning.dark',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
          <IconButton
            size="small"
            aria-label={`Upload file to ${folder.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setUploadOpen(true);
            }}
            sx={{
              p: 0.5,
              color: 'text.disabled',
              '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            <Plus size={14} />
          </IconButton>
        </Box>
      }
    >
      {!folder.isLeaf &&
        folder.children &&
        folder.children.map((child) => {
          const childId = `${folderId}-${child.id}`;
          const childDocCount = counts?.[child.id] || 0;

          return (
            <TreeItem
              key={childId}
              itemId={childId}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <FileText size={14} style={{ color: '#6b7280' }} />
                  <Box sx={{ flexGrow: 1 }}>{child.name}</Box>
                  {childDocCount > 0 && (
                    <Chip
                      label={childDocCount}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  )}
                  <IconButton
                    size="small"
                    aria-label={`Upload file to ${child.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadOpen(true);
                    }}
                    sx={{
                      p: 0.5,
                      color: 'text.disabled',
                      '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                    }}
                  >
                    <Plus size={14} />
                  </IconButton>
                </Box>
              }
            />
          );
        })}
      </TreeItem>

      {projectId && organizationId && (
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          projectId={projectId}
          taskId={taskId.replace('task-', '')}
          folderId={folder.id}
          folderName={folder.name}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </Fragment>
  );
}

function deriveStatus(percentDone: number) {
  if (percentDone >= 100) return { name: 'Completed', color: '#10b981' };
  if (percentDone > 0) return { name: 'In Progress', color: '#3b82f6' };
  return { name: 'Planned', color: '#6b7280' };
}

export default function ProjectsTree({ selectedNodeId, onSelect, projectId, organizationId }: ProjectsTreeProps) {
  const { data: tasks = [] } = api.gantt.tasks.useQuery(
    { organizationId: organizationId!, projectId: projectId! },
    { enabled: !!projectId && !!organizationId }
  );

  // Build grouped structure from database tasks:
  // Top-level tasks (no parentId) = groups, their children = tasks
  const { groups, grouped } = useMemo(() => {
    const topLevel = tasks.filter((t) => !t.parentId);
    const groupNames = topLevel.map((t) => t.name);
    const groupedMap: Record<string, Array<{ id: string; name: string; status: { name: string; color: string }; progress: number }>> = {};

    for (const parent of topLevel) {
      const children = tasks.filter((t) => t.parentId === parent.id);
      groupedMap[parent.name] = children.map((c) => ({
        id: c.id,
        name: c.name,
        status: deriveStatus(c.percentDone),
        progress: Math.round(c.percentDone),
      }));
    }

    return { groups: groupNames, grouped: groupedMap };
  }, [tasks]);

  const activeProjectId = projectId ?? null;
  const activeOrganizationId = organizationId;

  // Get all group IDs for default expansion
  const defaultExpandedItems = groups.map((group) => `group-${group}`);

  // Handle selection change
  const handleSelectedItemsChange = (_event: React.SyntheticEvent | null, itemIds: string | null) => {
    const nodeId = itemIds;
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
    <Box sx={{ width: '100%' }}>
      <SimpleTreeView
        defaultExpandedItems={defaultExpandedItems}
        selectedItems={selectedNodeId}
        onSelectedItemsChange={handleSelectedItemsChange}
      >
        {groups.map((groupName) => {
          const tasks = grouped[groupName] || [];
          const groupId = `group-${groupName}`;

          return (
            <TreeItem
              key={groupId}
              itemId={groupId}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Folder size={16} />
                  <Box sx={{ fontWeight: 500, flexGrow: 1 }}>{groupName}</Box>
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </Box>
                </Box>
              }
            >
              {tasks.map((task) => {
                const taskId = `task-${task.id}`;

                return (
                  <TreeItem
                    key={taskId}
                    itemId={taskId}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: task.status.color,
                            flexShrink: 0,
                          }}
                        />
                        <Box
                          sx={{
                            flexGrow: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.name}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {task.progress !== undefined && (
                            <Box sx={{ color: 'text.secondary' }}>{task.progress}%</Box>
                          )}
                          <Box sx={{ fontWeight: 500, color: task.status.color }}>
                            {task.status.name}
                          </Box>
                        </Box>
                      </Box>
                    }
                  >
                    {folderData.map((folder) => (
                      <FolderNode
                        key={`${taskId}-${folder.id}`}
                        folder={folder}
                        taskId={taskId}
                        projectId={activeProjectId}
                        organizationId={activeOrganizationId}
                      />
                    ))}
                  </TreeItem>
                );
              })}
            </TreeItem>
          );
        })}
      </SimpleTreeView>
    </Box>
  );
}
