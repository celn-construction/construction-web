'use client';

import { useState, useCallback, Fragment, useMemo, useEffect } from 'react';
import {
  FolderSimple,
  FolderOpen,
  FileText,
  Plus,
  CalendarBlank,
  ArrowsInSimple,
  ArrowsOutSimple,
  MagnifyingGlass,
  X,

  Question,
  PaperPlaneTilt,
  PencilSimpleLine,
  Camera,
  ClipboardText,
  Hammer,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box, IconButton, InputBase, Skeleton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '@/trpc/react';
import UploadDialog from '@/components/documents/UploadDialog';
import { folderData } from '@/lib/folders';

export { folderData };

const folderIconMap: Record<string, PhosphorIcon> = {
  rfi: Question,
  submittals: PaperPlaneTilt,
  'change-orders': PencilSimpleLine,
  photos: Camera,
  inspections: ClipboardText,
};

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
  expandedItems: string[];
}

function FolderNode({ folder, taskId, projectId, organizationId, expandedItems }: FolderNodeProps) {
  const theme = useTheme();
  const folderId = `${taskId}-${folder.id}`;
  const isExpanded = expandedItems.includes(folderId);
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

  const documentCount = counts?.[folder.id]?.total ?? 0;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.375 }}>
          {(() => {
            const FolderIcon = folderIconMap[folder.id] ?? (isExpanded ? FolderOpen : FolderSimple);
            return <FolderIcon size={14} color={folder.color} />;
          })()}
          <Box sx={{ fontWeight: 500, flexGrow: 1, fontSize: '0.8125rem' }}>{folder.name}</Box>
          {documentCount > 0 && (
            <Box
              sx={{
                minWidth: 18,
                height: 18,
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.5,
                fontSize: '0.625rem',
                fontWeight: 600,
                lineHeight: 1,
                bgcolor: `${folder.color}18`,
                color: folder.color,
                border: '1px solid',
                borderColor: `${folder.color}30`,
              }}
            >
              {documentCount}
            </Box>
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
            <Plus size={14} weight="bold" />
          </IconButton>
        </Box>
      }
    >
      {!folder.isLeaf &&
        folder.children &&
        folder.children.filter((child) => (counts?.[child.id]?.total ?? 0) > 0).map((child) => {
          const childId = `${folderId}-${child.id}`;
          const childDocCount = counts?.[child.id]?.total ?? 0;
          const childDocs = (allDocs ?? []).filter((d) => d.folderId === child.id);

          return (
            <TreeItem
              key={childId}
              itemId={childId}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.375 }}>
                  <FileText size={14} style={{ opacity: 0.6 }} />
                  <Box sx={{ flexGrow: 1, fontSize: '0.8125rem' }}>{child.name}</Box>
                  {childDocCount > 0 && (
                    <Box
                      sx={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 0.5,
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        lineHeight: 1,
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                      }}
                    >
                      {childDocCount}
                    </Box>
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
                    <Plus size={14} weight="bold" />
                  </IconButton>
                </Box>
              }
            >
              {childDocs.map((doc) => (
                <TreeItem
                  key={`${taskId}-doc-${doc.id}`}
                  itemId={`${taskId}-doc-${doc.id}`}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.2 }}>
                      <FileText size={12} color={theme.palette.status.completed} />
                      <Box sx={{
                        flexGrow: 1,
                        fontSize: '0.75rem',
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
              <FileText size={12} style={{ color: theme.palette.status.completed }} />
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

function deriveStatus(percentDone: number, theme: import('@mui/material/styles').Theme) {
  if (percentDone >= 100) return { name: 'Completed', color: theme.palette.success.main };
  if (percentDone > 0) return { name: 'In Progress', color: theme.palette.status.completed };
  return { name: 'Planned', color: theme.palette.text.disabled };
}

export default function ProjectsTree({ selectedNodeId, onSelect, projectId, organizationId }: ProjectsTreeProps) {
  const theme = useTheme();
  const { data: tasks = [], isLoading } = api.gantt.tasks.useQuery(
    { organizationId: organizationId!, projectId: projectId! },
    { enabled: !!projectId && !!organizationId, placeholderData: keepPreviousData }
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
        status: deriveStatus(c.percentDone, theme),
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

  const expandAll = useCallback(() => {
    const allIds: string[] = [];
    for (const group of groups) {
      const groupId = `group-${group.id}`;
      allIds.push(groupId);
      const tasks = grouped[group.id] ?? [];
      if (tasks.length === 0) {
        // Group has no child tasks — folders hang directly off the group
        for (const folder of folderData) {
          allIds.push(`task-${group.id}-${folder.id}`);
        }
      } else {
        for (const task of tasks) {
          const taskId = `task-${task.id}`;
          allIds.push(taskId);
          for (const folder of folderData) {
            allIds.push(`${taskId}-${folder.id}`);
          }
        }
      }
    }
    setExpandedItems(allIds);
  }, [groups, grouped]);

  const collapseAll = useCallback(() => {
    setExpandedItems([]);
  }, []);

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const queryLower = searchQuery.toLowerCase();

  const { filteredGroups, filteredGrouped, searchExpandedIds } = useMemo(() => {
    if (!queryLower) {
      return { filteredGroups: groups, filteredGrouped: grouped, searchExpandedIds: null };
    }

    const fGroups: typeof groups = [];
    const fGrouped: typeof grouped = {};
    const expandIds: string[] = [];

    for (const group of groups) {
      const groupMatches = group.name.toLowerCase().includes(queryLower);
      const tasks = grouped[group.id] ?? [];
      const matchingTasks = tasks.filter((t) => t.name.toLowerCase().includes(queryLower));

      if (groupMatches || matchingTasks.length > 0) {
        const groupId = `group-${group.id}`;
        fGroups.push(group);
        fGrouped[group.id] = groupMatches ? tasks : matchingTasks;
        expandIds.push(groupId);

        // Auto-expand matching tasks
        const visibleTasks = groupMatches ? tasks : matchingTasks;
        for (const task of visibleTasks) {
          expandIds.push(`task-${task.id}`);
        }
      }
    }

    return { filteredGroups: fGroups, filteredGrouped: fGrouped, searchExpandedIds: expandIds };
  }, [queryLower, groups, grouped]);

  // When searching, override expanded items to show matches
  const effectiveExpandedItems = searchExpandedIds ?? expandedItems;
  const handleExpandedItemsChange = useCallback((_: React.SyntheticEvent | null, items: string[]) => {
    if (!searchQuery) setExpandedItems(items);
  }, [searchQuery]);

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

  const headerBar = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'text.primary',
          letterSpacing: '-0.01em',
        }}
      >
        File Tree
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          component="button"
          onClick={expandAll}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'text.secondary',
            opacity: 0.6,
            p: 0,
            fontSize: '0.5625rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            lineHeight: 1,
            transition: 'opacity 0.15s',
            '&:hover': { opacity: 1 },
          }}
        >
          <ArrowsOutSimple size={10} weight="bold" />
          Expand
        </Box>
        {expandedItems.length > 0 && (
          <Box
            component="button"
            onClick={collapseAll}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'text.secondary',
              opacity: 0.6,
              p: 0,
              fontSize: '0.5625rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              lineHeight: 1,
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 1 },
            }}
          >
            <ArrowsInSimple size={10} weight="bold" />
            Collapse
          </Box>
        )}
      </Box>
    </Box>
  );

  const searchBar = (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'border-color 0.15s',
          '&:focus-within': { borderColor: 'primary.main' },
        }}
      >
        <MagnifyingGlass size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
        <InputBase
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            fontSize: '0.8125rem',
            '& .MuiInputBase-input': { p: 0 },
          }}
        />
        {searchQuery && (
          <IconButton
            size="small"
            onClick={() => setSearchQuery('')}
            sx={{ p: 0.25, color: 'text.secondary' }}
          >
            <X size={12} weight="bold" />
          </IconButton>
        )}
      </Box>
    </Box>
  );

  // Ghost tree loading state — real folder structure at reduced opacity
  if (isLoading) {
    const ghostGroups = [
      { nameWidth: 140, taskWidth: 160 },
      { nameWidth: 180, taskWidth: 120 },
    ];

    return (
      <Box sx={{ width: '100%' }}>
        {headerBar}
        <Box
          sx={{
            py: 0.5,
            '@keyframes ghostPulse': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 0.5 },
            },
            animation: 'ghostPulse 2s ease-in-out infinite',
          }}
        >
          {ghostGroups.map((group, gi) => (
            <Fragment key={gi}>
              {/* Group row — skeleton for dynamic name */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.375,
                  px: 1.5,
                }}
              >
                <FolderSimple size={16} style={{ flexShrink: 0, opacity: 0.4 }} />
                <Skeleton variant="rounded" width={group.nameWidth} height={12} animation={false} sx={{ flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1 }} />
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>0 tasks</Typography>
              </Box>

              {/* Task row — skeleton for dynamic name */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.375,
                  px: 1.5,
                  ml: 2.5,
                }}
              >
                <Hammer size={14} style={{ flexShrink: 0, opacity: 0.4 }} />
                <Skeleton variant="rounded" width={group.taskWidth} height={12} animation={false} sx={{ flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1 }} />
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>Planned</Typography>
              </Box>

              {/* Folder rows — real icons, names, and colors */}
              {folderData.map((folder) => {
                const FolderIcon = folderIconMap[folder.id] ?? FolderSimple;
                return (
                  <Box
                    key={folder.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.375,
                      px: 1.5,
                      ml: 5,
                    }}
                  >
                    <FolderIcon size={14} color={folder.color} style={{ flexShrink: 0 }} />
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: 'text.disabled',
                        flexGrow: 1,
                      }}
                    >
                      {folder.name}
                    </Typography>
                  </Box>
                );
              })}
            </Fragment>
          ))}
        </Box>
      </Box>
    );
  }

  // Empty state when no tasks exist
  if (groups.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {headerBar}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            p: 4,
            textAlign: 'center',
          }}
        >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '12px',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <CalendarBlank size={32} color="var(--text-disabled)" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          No Tasks Yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, mb: 2 }}>
          Add tasks to your Gantt chart to organize project documents
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 300 }}>
          💡 Tasks you create in the Gantt chart will automatically appear here with folders for documents, photos, and submittals
        </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {headerBar}
      {searchBar}
      {searchQuery && filteredGroups.length === 0 ? (
        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            No tasks matching &ldquo;{searchQuery}&rdquo;
          </Typography>
        </Box>
      ) : (
      <SimpleTreeView
        expandedItems={effectiveExpandedItems}
        onExpandedItemsChange={handleExpandedItemsChange}
        selectedItems={selectedNodeId}
        onSelectedItemsChange={handleSelectedItemsChange}
        sx={{
          '& .MuiTreeItem-content': {
            borderRadius: '8px',
            transition: 'background-color 0.15s ease',
            '&:hover': {
              bgcolor: 'sidebar.hoverBg',
            },
            '&.Mui-selected': {
              bgcolor: 'sidebar.activeItemBg',
              '&:hover': {
                bgcolor: 'sidebar.activeItemBg',
              },
            },
            '&.Mui-focused': {
              bgcolor: 'transparent',
            },
          },
        }}
      >
        {filteredGroups.map((group) => {
          const tasks = filteredGrouped[group.id] || [];
          const groupId = `group-${group.id}`;

          return (
            <TreeItem
              key={groupId}
              itemId={groupId}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.375 }}>
                  {effectiveExpandedItems.includes(groupId) && tasks.length > 0 ? (
                    <FolderOpen size={16} />
                  ) : (
                    <FolderSimple size={16} />
                  )}
                  <Box sx={{ fontWeight: 500, flexGrow: 1, fontSize: '0.8125rem' }}>{group.name}</Box>
                  <Box sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </Box>
                </Box>
              }
            >
              {tasks.length === 0 && folderData.map((folder) => (
                <FolderNode
                  key={`task-${group.id}-${folder.id}`}
                  folder={folder}
                  taskId={`task-${group.id}`}
                  projectId={activeProjectId}
                  organizationId={activeOrganizationId}
                  expandedItems={expandedItems}
                />
              ))}
              {tasks.map((task) => {
                const taskId = `task-${task.id}`;

                return (
                  <TreeItem
                    key={taskId}
                    itemId={taskId}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.375, minWidth: 0 }}>
                        <Hammer size={14} color={task.status.color} style={{ flexShrink: 0 }} />
                        <Box
                          sx={{
                            flexGrow: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.8125rem',
                          }}
                        >
                          {task.name}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            fontSize: '0.6875rem',
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
                        expandedItems={expandedItems}
                      />
                    ))}
                  </TreeItem>
                );
              })}
            </TreeItem>
          );
        })}
      </SimpleTreeView>
      )}
    </Box>
  );
}
