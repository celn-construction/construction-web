'use client';

import { useState, Fragment, useMemo, useEffect } from 'react';
import { Folder, FileText, Plus, Calendar } from 'lucide-react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import { api } from '@/trpc/react';
import UploadDialog from '@/components/documents/UploadDialog';
import { folderData } from '@/lib/folders';

export { folderData };

export interface Selection {
  type: 'task' | 'folder' | 'document';
  nodeId: string;
  taskId: string;
  folderName?: string;
  parentFolderName?: string;
  folderId?: string;
  documentId?: string;
  documentName?: string;
  blobUrl?: string;
  mimeType?: string;
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

  // Get all documents for this task (shared across FolderNodes via React Query cache)
  const { data: allDocs } = api.document.listByTask.useQuery(
    {
      organizationId: organizationId!,
      projectId: projectId!,
      taskId: taskId.replace('task-', ''),
    },
    {
      enabled: !!organizationId && !!projectId,
    }
  );

  // Filter docs for this specific folder
  const folderDocs = useMemo(
    () => (allDocs ?? []).filter((d) => d.folderId === folder.id),
    [allDocs, folder.id]
  );

  const documentCount = counts?.[folder.id] || 0;

  const handleUploadComplete = () => {
    if (organizationId && projectId) {
      void utils.document.countByTask.invalidate({
        organizationId,
        projectId,
        taskId: taskId.replace('task-', ''),
      });
      void utils.document.listByTask.invalidate({
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
        folder.children.filter((child) => (counts?.[child.id] ?? 0) > 0).map((child) => {
          const childId = `${folderId}-${child.id}`;
          const childDocCount = counts?.[child.id] || 0;
          const childDocs = (allDocs ?? []).filter((d) => d.folderId === child.id);

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
            >
              {childDocs.map((doc) => (
                <TreeItem
                  key={`${taskId}-doc-${doc.id}`}
                  itemId={`${taskId}-doc-${doc.id}`}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                      <FileText size={12} style={{ color: '#3b82f6' }} />
                      <Box sx={{
                        flexGrow: 1,
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {doc.name}
                      </Box>
                    </Box>
                  }
                />
              ))}
            </TreeItem>
          );
        })}
      {/* Documents directly in this folder */}
      {folderDocs.map((doc) => (
        <TreeItem
          key={`${taskId}-doc-${doc.id}`}
          itemId={`${taskId}-doc-${doc.id}`}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
              <FileText size={12} style={{ color: '#3b82f6' }} />
              <Box sx={{
                flexGrow: 1,
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {doc.name}
              </Box>
            </Box>
          }
        />
      ))}
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
    const groupedMap: Record<string, Array<{ id: string; name: string; status: { name: string; color: string }; progress: number }>> = {};

    for (const parent of topLevel) {
      const children = tasks.filter((t) => t.parentId === parent.id);
      groupedMap[parent.id] = children.map((c) => ({
        id: c.id,
        name: c.name,
        status: deriveStatus(c.percentDone),
        progress: Math.round(c.percentDone),
      }));
    }

    return { groups: topLevel.map((t) => ({ id: t.id, name: t.name })), grouped: groupedMap };
  }, [tasks]);

  const activeProjectId = projectId ?? null;
  const activeOrganizationId = organizationId;

  // Controlled expanded state — auto-expand new groups as they load
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  useEffect(() => {
    const groupIds = groups.map((g) => `group-${g.id}`);
    setExpandedItems((prev) => {
      const toAdd = groupIds.filter((id) => !prev.includes(id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, [groups]);

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

    // Parse document selection: task-{taskId}-doc-{docId}
    const docMatch = nodeId.match(/^task-(.+)-doc-(.+)$/);
    if (docMatch && docMatch[1] && docMatch[2]) {
      onSelect({
        type: 'document',
        nodeId,
        taskId: docMatch[1],
        documentId: docMatch[2],
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

  // Empty state when no tasks exist
  if (groups.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Calendar size={32} style={{ color: 'var(--text-disabled)' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          No Tasks Yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, mb: 2 }}>
          Add tasks to your Gantt chart to organize project documents
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 300 }}>
          💡 Tasks you create in the Gantt chart will automatically appear here with folders for documents, photos, and submittals
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <SimpleTreeView
        expandedItems={expandedItems}
        onExpandedItemsChange={(_, items) => setExpandedItems(items)}
        selectedItems={selectedNodeId}
        onSelectedItemsChange={handleSelectedItemsChange}
      >
        {groups.map((group) => {
          const tasks = grouped[group.id] || [];
          const groupId = `group-${group.id}`;

          return (
            <TreeItem
              key={groupId}
              itemId={groupId}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Folder size={16} />
                  <Box sx={{ fontWeight: 500, flexGrow: 1 }}>{group.name}</Box>
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
