'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { Box, Popover, Typography, Divider } from '@mui/material';

import { POPOVER_WIDTH, POPOVER_EXPANDED_WIDTH } from '../constants';
import { folderData, expandFolderIds, type Folder } from '@/lib/folders';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useOrgContext } from '@/components/providers/OrgProvider';
import UploadDialog from '@/components/documents/UploadDialog';
import { api } from '@/trpc/react';
import { trackUpload } from '@/store/uploadStatusStore';
import type { PopoverPlacement, BryntumGanttInstance } from '../types';
import type { PreviewDoc, DocumentItem } from './task-popover/types';

import { ArrowsInSimple, ArrowsOutSimple } from '@phosphor-icons/react';
import TaskHeader from './task-popover/TaskHeader';
import CoverImageBanner from './task-popover/CoverImageBanner';
import FolderRow from './task-popover/FolderRow';
import FilePreviewPanel from './task-popover/FilePreviewPanel';
import SubmittalDrawer from './SubmittalDrawer';
import { canApproveDocuments } from '@/lib/permissions';
import type { SlotKind } from '@/lib/validations/gantt';

type RightPanel = { type: 'preview'; doc: PreviewDoc } | null;

type TaskDetailsPopoverProps = {
  open: boolean;
  taskName: string;
  taskId?: string;
  popoverPlacement: PopoverPlacement | null;
  ganttInstance: BryntumGanttInstance | null;
  onClose: () => void;
};

export function TaskDetailsPopover({
  open,
  taskName,
  taskId,
  popoverPlacement,
  ganttInstance,
  onClose,
}: TaskDetailsPopoverProps) {
  const { projectId, organizationId } = useProjectContext();
  const { memberRole } = useOrgContext();
  const canManageRequirements = memberRole === 'owner' || memberRole === 'admin';
  const canManageSlots = canApproveDocuments(memberRole);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadTarget, setUploadTarget] = useState<{ folder: { id: string; name: string }; slotId?: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [drawerKind, setDrawerKind] = useState<SlotKind | null>(null);
  // Per-slot upload tracking — drives the in-place "Uploading…" badge on
  // SlotDropzone rows so the user can see where the file is landing even
  // after the dialog closes. Both the dialog path and the DnD path feed
  // this set via markSlotUploading.
  const [uploadingSlotIds, setUploadingSlotIds] = useState<Set<string>>(new Set());
  const markSlotUploading = useCallback((slotId: string, on: boolean) => {
    setUploadingSlotIds((prev) => {
      if (prev.has(slotId) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(slotId);
      else next.delete(slotId);
      return next;
    });
  }, []);

  const openUploadDialog = useCallback(
    (folder: { id: string; name: string }, slotId?: string) => {
      setUploadTarget({ folder, slotId });
    },
    [],
  );

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
  // Routed through setSlotCount so the popover stepper, the drawer, and the
  // slot table all share a single write path. Updating only the legacy column
  // here used to leave orphan TaskRequirementSlot rows that silently reappeared
  // on the next increment.
  const setSlotCountMutation = api.gantt.setSlotCount.useMutation({
    onSuccess: (_data, variables) => {
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId: taskId! });
      void utils.gantt.listSlots.invalidate({
        organizationId,
        projectId,
        taskId: taskId!,
        kind: variables.kind,
      });
      void utils.gantt.requirementStats.invalidate({ projectId });
    },
  });

  const handleSaveRequirement = useCallback(
    (field: 'requiredSubmittals' | 'requiredInspections', count: number | null) => {
      if (!taskId) return;
      const kind: SlotKind = field === 'requiredSubmittals' ? 'submittal' : 'inspection';
      setSlotCountMutation.mutate({
        organizationId,
        projectId,
        taskId,
        kind,
        count: count ?? 0,
      });
    },
    [taskId, organizationId, projectId, setSlotCountMutation]
  );

  // ── Right panel helpers ──
  const openPreview = useCallback((doc: PreviewDoc) => {
    setRightPanel({ type: 'preview', doc });
  }, []);

  const closeRightPanel = useCallback(() => {
    setRightPanel(null);
  }, []);

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
    // listSlots now embeds the bound document; refresh both kinds so the slot
    // row that just received an upload re-renders as filled.
    void utils.gantt.listSlots.invalidate({ organizationId, projectId, taskId: taskId! });
    void utils.gantt.requirementStats.invalidate({ projectId });
    void utils.approval.summary.invalidate({ projectId });
    void utils.approval.listOverdueSlots.invalidate({ projectId });
    setUploadTarget(null);
  }, [organizationId, projectId, taskId, utils]);

  // Per-slot drag-and-drop upload: bypasses the dialog (no title/notes prompt)
  // and routes through trackUpload so the global chip shows progress. The
  // slotId is marked uploading so the SlotDropzone row also reflects that
  // state in-place until the upload resolves.
  const handleUploadFile = useCallback(
    (folderId: string, slotId: string, file: File) => {
      if (!taskId) return;
      markSlotUploading(slotId, true);
      void trackUpload<{ document: { id: string } }>(
        file,
        () => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);
          formData.append('taskId', taskId);
          formData.append('folderId', folderId);
          formData.append('slotId', slotId);
          return fetch('/api/upload', { method: 'POST', body: formData });
        },
        { maxBytes: 50 * 1024 * 1024 },
      ).then((result) => {
        markSlotUploading(slotId, false);
        if (result.ok) handleUploadComplete();
      });
    },
    [projectId, taskId, handleUploadComplete, markSlotUploading],
  );

  const handleClose = () => {
    setExpandedFolders(new Set());
    setRightPanel(null);
    onClose();
  };

  // Scroll target for the "View all" / "+ Add" actions in the header.
  const requirementsRef = useRef<HTMLDivElement | null>(null);
  const handleScrollToRequirements = useCallback(() => {
    // Open submittals + inspections so their counters are visible after scroll.
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add('submittals');
      next.add('inspections');
      return next;
    });
    // Defer until after the expand state lands a frame so the row heights are real.
    requestAnimationFrame(() => {
      requirementsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Compute current upload + approval counts for trackable folders.
  const getTrackableCount = (folder: Folder) => {
    const allIds = expandFolderIds(folder.id);
    let total = 0;
    let approved = 0;
    for (const id of allIds) {
      const c = counts?.[id];
      total += c?.total ?? 0;
      approved += c?.approved ?? 0;
    }
    return { total, approved, pending: total - approved };
  };
  const submittalsFolder = folderData.find((f) => f.id === 'submittals');
  const inspectionsFolder = folderData.find((f) => f.id === 'inspections');
  const submittalsCounts = submittalsFolder
    ? getTrackableCount(submittalsFolder)
    : { total: 0, approved: 0, pending: 0 };
  const inspectionsCounts = inspectionsFolder
    ? getTrackableCount(inspectionsFolder)
    : { total: 0, approved: 0, pending: 0 };
  const submittalsCurrent = submittalsCounts.approved;
  const inspectionsCurrent = inspectionsCounts.approved;

  const coverDocumentId = taskDetail?.coverDocumentId ?? null;
  const photos = ((allDocs ?? []) as DocumentItem[]).filter(
    (d) => d.folderId === 'photos' && d.mimeType.startsWith('image/')
  );
  const hasRightPanel = rightPanel !== null;
  const previewDoc = rightPanel?.type === 'preview' ? rightPanel.doc : null;
  const selectedDocId = previewDoc?.id ?? null;

  return (
    <>
      <Popover
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={popoverPlacement?.anchorPosition}
        // While the drawer is open, ignore backdrop clicks and Esc on the
        // popover so interacting with the drawer doesn't dismiss the popover
        // underneath. The drawer has its own close button + backdrop.
        onClose={(_event, reason) => {
          if (drawerKind && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
          handleClose();
        }}
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
              width: hasRightPanel ? POPOVER_EXPANDED_WIDTH : POPOVER_WIDTH,
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
              taskDetail={taskDetail}
              taskDetailLoading={taskDetailLoading}
              taskId={taskId}
              ganttInstance={ganttInstance}
              onClose={handleClose}
              onScrollToRequirements={handleScrollToRequirements}
              onOpenRequirementsDrawer={
                canManageSlots ? () => setDrawerKind('submittal') : undefined
              }
              submittalsCurrent={submittalsCurrent}
              inspectionsCurrent={inspectionsCurrent}
            />

            <CoverImageBanner
              taskId={taskId}
              projectId={projectId}
              organizationId={organizationId}
              coverDocumentId={coverDocumentId}
              photos={photos}
            />

            <Divider sx={{ mx: 2 }} />

            {/* ── DOCUMENTS SECTION ── */}
            <Box
              ref={requirementsRef}
              sx={{ p: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 1, scrollMarginTop: '8px' }}
            >
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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {folderData.map((folder) => {
                  const count = counts?.[folder.id]?.total ?? 0;
                  const folderDocs = ((allDocs ?? []) as DocumentItem[]).filter(
                    (d) => d.folderId === folder.id
                  );

                  // For trackable folders, sum counts across parent + child IDs
                  let trackingCurrent: number | undefined;
                  let trackingApproved: number | undefined;
                  let trackingPending: number | undefined;
                  let trackingRequired: number | null | undefined;
                  if (folder.trackable && folder.requirementField) {
                    const allIds = expandFolderIds(folder.id);
                    let total = 0;
                    let approved = 0;
                    for (const id of allIds) {
                      const c = counts?.[id];
                      total += c?.total ?? 0;
                      approved += c?.approved ?? 0;
                    }
                    trackingCurrent = approved;
                    trackingApproved = approved;
                    trackingPending = total - approved;
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
                      onUpload={openUploadDialog}
                      onUploadFile={handleUploadFile}
                      onSelectDoc={openPreview}
                      selectedDocId={selectedDocId}
                      // Tracking props
                      required={trackingRequired}
                      current={trackingCurrent}
                      approved={trackingApproved}
                      pending={trackingPending}
                      canManage={canManageRequirements}
                      onSaveRequirement={
                        folder.requirementField
                          ? (count) => handleSaveRequirement(folder.requirementField!, count)
                          : undefined
                      }
                      isRequirementPending={setSlotCountMutation.isPending}
                      projectId={projectId}
                      taskId={taskId}
                      organizationId={organizationId}
                      pinnedDocId={coverDocumentId}
                      onManage={
                        folder.trackable && canManageSlots
                          ? () => setDrawerKind(folder.id === 'submittals' ? 'submittal' : 'inspection')
                          : undefined
                      }
                      memberRole={memberRole}
                      uploadingSlotIds={uploadingSlotIds}
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* ── RIGHT PANEL ── */}
          {rightPanel && (
            <>
              <Divider orientation="vertical" flexItem />
              <FilePreviewPanel
                previewDoc={rightPanel.doc}
                onClose={closeRightPanel}
              />
            </>
          )}
        </Box>
      </Popover>

      {/* Upload dialog */}
      {uploadTarget && taskId && (() => {
        // Snapshot the slotId so the lifecycle callbacks survive the dialog
        // closing — `setUploadTarget(null)` runs synchronously inside
        // onOpenChange, but the upload resolves later. Reading
        // `uploadTarget.slotId` from inside the callback at that point would
        // dereference null.
        const slotIdSnapshot = uploadTarget.slotId;
        return (
          <UploadDialog
            open
            onOpenChange={(isOpen) => {
              if (!isOpen) setUploadTarget(null);
            }}
            projectId={projectId}
            taskId={taskId}
            folderId={uploadTarget.folder.id}
            folderName={uploadTarget.folder.name}
            slotId={slotIdSnapshot}
            onUploadComplete={handleUploadComplete}
            // Only the slot-bound path needs the lifecycle hooks — the "+" button
            // upload path has no slot to badge, the global chip alone covers it.
            onUploadStart={
              slotIdSnapshot ? () => markSlotUploading(slotIdSnapshot, true) : undefined
            }
            onUploadEnd={
              slotIdSnapshot ? () => markSlotUploading(slotIdSnapshot, false) : undefined
            }
          />
        );
      })()}

      {/* Submittal/inspection management drawer */}
      {drawerKind && taskId && (
        <SubmittalDrawer
          open
          onClose={() => setDrawerKind(null)}
          organizationId={organizationId}
          projectId={projectId}
          taskId={taskId}
          taskName={taskName}
          memberRole={memberRole}
          initialKind={drawerKind}
          docsByKind={{
            submittal: ((allDocs ?? []) as DocumentItem[]).filter((d) =>
              expandFolderIds('submittals').includes(d.folderId),
            ),
            inspection: ((allDocs ?? []) as DocumentItem[]).filter((d) =>
              expandFolderIds('inspections').includes(d.folderId),
            ),
          }}
          onUploadToFolder={(folderId, slotId) => {
            const folder = folderData.find((f) => f.id === folderId);
            if (folder) openUploadDialog({ id: folder.id, name: folder.name }, slotId);
          }}
        />
      )}
    </>
  );
}
