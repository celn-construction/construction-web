'use client';

import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { FileText, CheckCircle } from '@phosphor-icons/react';
import type { FolderContentProps, PreviewDoc } from './types';
import { api } from '@/trpc/react';
import type { SlotKind } from '@/lib/validations/gantt';
import { canApproveDocuments } from '@/lib/permissions';
import ApprovalToggleSwitch from './ApprovalToggleSwitch';
import SlotDropzone from './SlotDropzone';

interface TrackableFolderContentProps extends FolderContentProps {
  required: number | null;
  folderColor: string;
  kind?: SlotKind;
}

function TrackableFolderContentInner({
  onSelectDoc,
  selectedDocId,
  onUpload,
  onUploadFile,
  folderName,
  required,
  folderColor,
  kind,
  taskId,
  projectId,
  organizationId,
  memberRole,
  uploadingSlotIds,
}: TrackableFolderContentProps) {
  const theme = useTheme();
  const utils = api.useUtils();
  const successMain = theme.palette.success.main;
  const canShowApproval =
    !!organizationId && typeof memberRole === 'string';
  const canEditDueDate = !!memberRole && canApproveDocuments(memberRole);

  // Slots now carry their bound document (Document.slotId FK). The first
  // element of slot.documents is the doc; null means the slot is empty.
  const slotsQuery = api.gantt.listSlots.useQuery(
    { organizationId: organizationId!, projectId: projectId!, taskId: taskId!, kind: kind! },
    { enabled: !!kind && !!taskId && !!projectId && !!organizationId && (required ?? 0) > 0 },
  );
  const slots = slotsQuery.data ?? [];

  // Per-slot due-date editing — mutation invalidates listSlots so the chip
  // re-renders, and the Review Queue's Overdue tab so it picks up changes too.
  const updateSlotMutation = api.gantt.updateSlot.useMutation({
    onSuccess: () => {
      if (organizationId && projectId && taskId && kind) {
        void utils.gantt.listSlots.invalidate({ organizationId, projectId, taskId, kind });
      }
      if (projectId) {
        void utils.approval.listOverdueSlots.invalidate({ projectId });
      }
    },
  });
  const setSlotDueDate = (slotId: string, dueDate: string | null) => {
    if (!organizationId || !projectId) return;
    updateSlotMutation.mutate({ organizationId, projectId, slotId, dueDate });
  };

  // No requirement set — empty state (no dropzones until a requirement is configured)
  if (required === null || required === 0) {
    return (
      <Box
        sx={{
          ml: '36px',
          mr: 0.75,
          my: 0.75,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.2 }}>
          No {folderName.toLowerCase()} required
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.2 }}>
          Set a requirement to start tracking
        </Typography>
      </Box>
    );
  }

  const singularName = folderName.replace(/s$/i, '');

  return (
    <Box sx={{ pl: '20px', display: 'flex', flexDirection: 'column', gap: '4px', py: 0.75 }}>
      {slots.map((slot) => {
        const slotNum = slot.index + 1;
        const doc = slot.document;
        const isFilled = !!doc;
        const isSelected = isFilled && selectedDocId === doc.id;

        if (isFilled) {
          const preview: PreviewDoc = {
            id: doc.id,
            name: doc.name,
            blobUrl: doc.blobUrl,
            mimeType: doc.mimeType,
            size: doc.size,
            createdAt: doc.createdAt,
            uploadedBy: doc.uploadedBy ?? null,
            folderId: doc.folderId ?? '',
            approvalStatus: doc.approvalStatus,
            approvedAt: doc.approvedAt,
            approvedBy: doc.approvedBy,
          };
          const isApproved = doc.approvalStatus === 'approved';

          return (
            <Box
              key={slot.id}
              onClick={() => onSelectDoc(preview)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                py: '5px',
                px: 1,
                minHeight: 32,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              {/* Slot number badge — green when approved, folder-colored otherwise */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: isApproved ? alpha(successMain, 0.12) : `${folderColor}18`,
                  flexShrink: 0,
                  transition: 'background-color 0.2s',
                }}
              >
                <CheckCircle
                  size={11}
                  weight="fill"
                  color={isApproved ? successMain : folderColor}
                />
              </Box>

              <FileText
                size={14}
                color={isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                style={{ flexShrink: 0 }}
              />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: isSelected ? 500 : 400,
                  flex: 1,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {doc.name}
              </Typography>
              {canShowApproval && (
                <ApprovalToggleSwitch
                  documentId={doc.id}
                  documentName={doc.name}
                  approvalStatus={doc.approvalStatus}
                  approvedBy={doc.approvedBy}
                  organizationId={organizationId!}
                  memberRole={memberRole!}
                  size="sm"
                />
              )}
              {doc.createdAt != null && (
                <Typography
                  sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}
                  title={`Uploaded ${new Date(doc.createdAt).toLocaleString()}`}
                >
                  ↑ {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              )}
            </Box>
          );
        }

        // Empty slot — drop a file directly onto the row (real DnD), or
        // click to open the upload dialog (where you can add title + notes).
        return (
          <SlotDropzone
            key={slot.id}
            slotNum={slotNum}
            label={slot.name?.trim() || `${singularName} ${slotNum}`}
            folderColor={folderColor}
            dueDate={slot.dueDate}
            canEditDueDate={canEditDueDate}
            onSetDueDate={(dueDate) => setSlotDueDate(slot.id, dueDate)}
            onClick={() => onUpload(slot.id)}
            onDropFile={onUploadFile ? (file) => onUploadFile(slot.id, file) : undefined}
            isUploading={uploadingSlotIds?.has(slot.id) ?? false}
          />
        );
      })}
    </Box>
  );
}

const TrackableFolderContent = React.memo(TrackableFolderContentInner);
export default TrackableFolderContent;
