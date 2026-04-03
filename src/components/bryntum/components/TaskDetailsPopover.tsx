'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { Box, Popover, Typography, Divider } from '@mui/material';

import { POPOVER_WIDTH, POPOVER_EXPANDED_WIDTH } from '../constants';
import { folderData, expandFolderIds } from '@/lib/folders';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useOrgContext } from '@/components/providers/OrgProvider';
import UploadDialog from '@/components/documents/UploadDialog';
import { api } from '@/trpc/react';
import type { PopoverPlacement } from '../types';
import type { PreviewDoc, DocumentItem } from './task-popover/types';

import { ArrowsInSimple, ArrowsOutSimple } from '@phosphor-icons/react';
import TaskHeader from './task-popover/TaskHeader';
import CoverImageBanner from './task-popover/CoverImageBanner';
import FolderRow from './task-popover/FolderRow';
import FilePreviewPanel from './task-popover/FilePreviewPanel';

type TaskDetailsPopoverProps = {
  open: boolean;
  taskName: string;
  taskId?: string;
  popoverPlacement: PopoverPlacement | null;
  onClose: () => void;
};

export function TaskDetailsPopover({
  open,
  taskName,
  taskId,
  popoverPlacement,
  onClose,
}: TaskDetailsPopoverProps) {
  const { projectId, organizationId } = useProjectContext();
  const { memberRole } = useOrgContext();
  const canManageRequirements = memberRole === 'owner' || memberRole === 'admin';

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadFolder, setUploadFolder] = useState<{ id: string; name: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);

  // ── Drag state ──
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (open) setDragOffset({ x: 0, y: 0 });
  }, [open]);

  const bindDrag = useDrag(
    ({ offset: [x, y], dragging }) => {
      setDragOffset({ x, y });
      setIsDragging(!!dragging);
    },
    {
      from: () => [dragOffset.x, dragOffset.y],
      filterTaps: true,
      pointer: { capture: false },
    },
  );

  // ── Data queries ──
  const utils = api.useUtils();

  const { data: taskDetail, isLoading: taskDetailLoading } = api.gantt.taskDetail.useQuery(
    { organizationId, projectId, taskId: taskId! },
    { enabled: !!organizationId && !!projectId && !!taskId }
  );

  const { data: allDocs } = api.document.listByTask.useQuery(
    { organizationId, projectId, taskId: taskId! },
    { enabled: !!organizationId && !!projectId && !!taskId }
  );

  const { data: counts } = api.document.countByTask.useQuery(
    { organizationId, projectId, taskId: taskId! },
    { enabled: !!organizationId && !!projectId && !!taskId }
  );

  // ── Requirement mutation ──
  const updateRequirementMutation = api.gantt.updateRequirement.useMutation({
    onSuccess: () => {
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId: taskId! });
    },
  });

  const handleSaveRequirement = useCallback(
    (field: 'requiredSubmittals' | 'requiredInspections', count: number | null) => {
      if (!taskId) return;
      updateRequirementMutation.mutate({
        organizationId,
        projectId,
        taskId,
        field,
        count,
      });
    },
    [taskId, organizationId, projectId, updateRequirementMutation]
  );

  // ── Callbacks ──
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedFolders(new Set(folderData.map((f) => f.id)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  const handleUploadComplete = useCallback(() => {
    void utils.document.countByTask.invalidate({ organizationId, projectId, taskId: taskId! });
    void utils.document.listByTask.invalidate({ organizationId, projectId, taskId: taskId! });
    void utils.document.listByFolder.invalidate({ organizationId, projectId, taskId: taskId! });
    setUploadFolder(null);
  }, [organizationId, projectId, taskId, utils]);

  const handleClose = () => {
    setExpandedFolders(new Set());
    setPreviewDoc(null);
    onClose();
  };

  const coverImageUrl = taskDetail?.coverImageUrl ?? null;

  return (
    <>
      <Popover
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={popoverPlacement?.anchorPosition}
        onClose={handleClose}
        transformOrigin={
          popoverPlacement?.transformOrigin ?? { vertical: 'center', horizontal: 'left' }
        }
        slotProps={{
          paper: {
            sx: {
              m: popoverPlacement?.paperMargin ?? '0 0 0 8px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 24px 64px -12px rgba(0,0,0,0.12), 0 8px 20px -8px rgba(0,0,0,0.04)',
              maxHeight: '85vh',
              width: previewDoc ? POPOVER_EXPANDED_WIDTH : POPOVER_WIDTH,
              transition: isDragging ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              marginLeft: `${dragOffset.x}px`,
              marginTop: `${dragOffset.y}px`,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex' }}>
          {/* ── LEFT PANEL ── */}
          <Box sx={{ width: POPOVER_WIDTH, flexShrink: 0, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflowY: 'auto' }}>

            {/* Drag handle */}
            <Box
              {...bindDrag()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: '5px',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
                '&:hover .drag-pill': { opacity: 0.5 },
              }}
            >
              <Box
                className="drag-pill"
                sx={{
                  width: 32,
                  height: 3.5,
                  borderRadius: '999px',
                  bgcolor: 'text.primary',
                  opacity: 0.15,
                  transition: 'opacity 0.15s',
                }}
              />
            </Box>

            <TaskHeader
              taskName={taskName}
              taskId={taskId}
              organizationId={organizationId}
              projectId={projectId}
              taskDetail={taskDetail}
              taskDetailLoading={taskDetailLoading}
              onClose={handleClose}
            />

            <CoverImageBanner
              taskId={taskId}
              projectId={projectId}
              organizationId={organizationId}
              coverImageUrl={coverImageUrl}
            />

            <Divider sx={{ mx: 2 }} />

            {/* ── DOCUMENTS SECTION ── */}
            <Box sx={{ p: '12px 16px 14px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  sx={{
                    fontSize: '0.5625rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    userSelect: 'none',
                    lineHeight: 1,
                  }}
                >
                  Files
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
                  {expandedFolders.size > 0 && (
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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {folderData.map((folder) => {
                  const count = counts?.[folder.id] ?? 0;
                  const folderDocs = ((allDocs ?? []) as DocumentItem[]).filter(
                    (d) => d.folderId === folder.id
                  );

                  // For trackable folders, sum counts across parent + child IDs
                  let trackingCurrent: number | undefined;
                  let trackingRequired: number | null | undefined;
                  if (folder.trackable && folder.requirementField) {
                    const allIds = expandFolderIds(folder.id);
                    trackingCurrent = allIds.reduce((sum, id) => sum + (counts?.[id] ?? 0), 0);
                    trackingRequired = taskDetail?.[folder.requirementField] ?? null;
                  }

                  return (
                    <FolderRow
                      key={folder.id}
                      folder={folder}
                      isExpanded={expandedFolders.has(folder.id)}
                      onToggle={() => toggleFolder(folder.id)}
                      count={count}
                      docs={folderDocs}
                      onUpload={setUploadFolder}
                      onSelectDoc={setPreviewDoc}
                      selectedDocId={previewDoc?.id ?? null}
                      // Tracking props
                      required={trackingRequired}
                      current={trackingCurrent}
                      canManage={canManageRequirements}
                      onSaveRequirement={
                        folder.requirementField
                          ? (count) => handleSaveRequirement(folder.requirementField!, count)
                          : undefined
                      }
                      isRequirementPending={updateRequirementMutation.isPending}
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* ── RIGHT PREVIEW PANEL ── */}
          {previewDoc && (
            <>
              <Divider orientation="vertical" flexItem />
              <FilePreviewPanel previewDoc={previewDoc} />
            </>
          )}
        </Box>
      </Popover>

      {/* Upload dialog */}
      {uploadFolder && taskId && (
        <UploadDialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) setUploadFolder(null);
          }}
          projectId={projectId}
          taskId={taskId}
          folderId={uploadFolder.id}
          folderName={uploadFolder.name}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  );
}
