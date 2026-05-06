'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  X,
  Minus,
  Plus,
  PaperPlaneTilt,
  ClipboardText,
  CheckCircle,
  UserCircle,
  Trash,
  CloudArrowUp,
  WarningCircle,
} from '@phosphor-icons/react';
import { format, isBefore, startOfDay } from 'date-fns';

import { api } from '@/trpc/react';
import type { SlotKind } from '@/lib/validations/gantt';
import type { DocumentItem } from './task-popover/types';

const SUBMITTAL_COLOR = '#2563EB';
const INSPECTION_COLOR = '#8E44AD';

const KIND_META: Record<SlotKind, {
  label: string;
  pluralLabel: string;
  color: string;
  icon: typeof PaperPlaneTilt;
  folderId: 'submittals' | 'inspections';
  uploadCta: string;
}> = {
  submittal: {
    label: 'submittal',
    pluralLabel: 'submittals',
    color: SUBMITTAL_COLOR,
    icon: PaperPlaneTilt,
    folderId: 'submittals',
    uploadCta: 'Upload submittal',
  },
  inspection: {
    label: 'inspection',
    pluralLabel: 'inspections',
    color: INSPECTION_COLOR,
    icon: ClipboardText,
    folderId: 'inspections',
    uploadCta: 'Upload report',
  },
};

interface SubmittalDrawerProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  projectId: string;
  taskId: string;
  taskName: string;
  initialKind?: SlotKind;
  /** Documents already uploaded under this task — used to mark slots as filled in order. */
  docsByKind: Record<SlotKind, DocumentItem[]>;
  /** Open the upload dialog for a given folder. Reuses the existing UploadDialog flow. */
  onUploadToFolder: (folderId: 'submittals' | 'inspections') => void;
}

export default function SubmittalDrawer({
  open,
  onClose,
  organizationId,
  projectId,
  taskId,
  taskName,
  initialKind = 'submittal',
  docsByKind,
  onUploadToFolder,
}: SubmittalDrawerProps) {
  const [activeKind, setActiveKind] = useState<SlotKind>(initialKind);

  // Reset to the requested kind whenever the drawer (re)opens.
  useEffect(() => {
    if (open) setActiveKind(initialKind);
  }, [open, initialKind]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // Sit above the task popover (MUI Popover default is 1300).
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          width: 480,
          maxWidth: '100vw',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DrawerHeader
        kind={activeKind}
        taskName={taskName}
        onClose={onClose}
      />

      <KindTabs
        activeKind={activeKind}
        onChange={setActiveKind}
        countSubmittal={docsByKind.submittal.length}
        countInspection={docsByKind.inspection.length}
      />

      <DrawerContent
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        kind={activeKind}
        docs={docsByKind[activeKind]}
        onUploadToFolder={() => onUploadToFolder(KIND_META[activeKind].folderId)}
      />
    </Drawer>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────────────────────
function DrawerHeader({
  kind,
  taskName,
  onClose,
}: {
  kind: SlotKind;
  taskName: string;
  onClose: () => void;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2.5,
        py: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          bgcolor: `${meta.color}1F`,
          color: meta.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.2s, color 0.2s',
        }}
      >
        <Icon size={14} weight="regular" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.005em' }}>
          Manage {meta.pluralLabel}
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: 'text.secondary',
            mt: 0.25,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {taskName}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }} aria-label="Close drawer">
        <X size={16} />
      </IconButton>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tab toggle
// ────────────────────────────────────────────────────────────────────────────
function KindTabs({
  activeKind,
  onChange,
  countSubmittal,
  countInspection,
}: {
  activeKind: SlotKind;
  onChange: (k: SlotKind) => void;
  countSubmittal: number;
  countInspection: number;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.25,
        px: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <KindTab kind="submittal" active={activeKind === 'submittal'} onClick={() => onChange('submittal')} count={countSubmittal} />
      <KindTab kind="inspection" active={activeKind === 'inspection'} onClick={() => onChange('inspection')} count={countInspection} />
    </Box>
  );
}

function KindTab({
  kind,
  active,
  onClick,
  count,
}: {
  kind: SlotKind;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.875,
        px: 1.5,
        py: 1.25,
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid',
        borderColor: active ? meta.color : 'transparent',
        marginBottom: '-1px',
        cursor: 'pointer',
        color: active ? meta.color : 'text.secondary',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 500,
        transition: 'color 0.15s, border-color 0.15s',
        '&:hover': { color: active ? meta.color : 'text.primary' },
      }}
    >
      <Icon size={13} weight={active ? 'fill' : 'regular'} />
      {meta.pluralLabel.charAt(0).toUpperCase() + meta.pluralLabel.slice(1)}
      <Box
        sx={{
          fontSize: 10,
          fontWeight: 600,
          px: 0.875,
          py: '1px',
          borderRadius: '999px',
          bgcolor: active ? `${meta.color}1F` : 'action.selected',
          color: active ? meta.color : 'text.secondary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Body — required count stepper + slot list
// ────────────────────────────────────────────────────────────────────────────
function DrawerContent({
  organizationId,
  projectId,
  taskId,
  kind,
  docs,
  onUploadToFolder,
}: {
  organizationId: string;
  projectId: string;
  taskId: string;
  kind: SlotKind;
  docs: DocumentItem[];
  onUploadToFolder: () => void;
}) {
  const meta = KIND_META[kind];
  const utils = api.useUtils();

  const slotsQuery = api.gantt.listSlots.useQuery(
    { organizationId, projectId, taskId, kind },
    { enabled: !!organizationId && !!projectId && !!taskId },
  );
  const slots = slotsQuery.data ?? [];

  const setCountMutation = api.gantt.setSlotCount.useMutation({
    onSuccess: () => {
      void utils.gantt.listSlots.invalidate({ organizationId, projectId, taskId, kind });
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
      void utils.gantt.requirementStats.invalidate({ projectId });
    },
  });

  const updateSlotMutation = api.gantt.updateSlot.useMutation({
    onSuccess: () => {
      void utils.gantt.listSlots.invalidate({ organizationId, projectId, taskId, kind });
    },
  });

  // Members for the approver picker (cached at the org level).
  const membersQuery = api.member.list.useQuery(
    { organizationId },
    { enabled: !!organizationId, staleTime: 60_000 },
  );
  const members = membersQuery.data ?? [];

  // Decrement-with-data confirm state.
  const [confirmRemove, setConfirmRemove] = useState<null | { trailingFilled: number; nextCount: number }>(null);

  const filledCount = Math.min(docs.length, slots.length);

  const handleStepCount = (next: number) => {
    if (next < 0 || next > 50) return;
    if (next < slots.length) {
      // Removing slots — warn if any of the trailing slots map to an uploaded file.
      const trailingFilled = Math.max(0, filledCount - next);
      if (trailingFilled > 0) {
        setConfirmRemove({ trailingFilled, nextCount: next });
        return;
      }
    }
    setCountMutation.mutate({ organizationId, projectId, taskId, kind, count: next });
  };

  const confirmAndShrink = () => {
    if (!confirmRemove) return;
    setCountMutation.mutate({
      organizationId,
      projectId,
      taskId,
      kind,
      count: confirmRemove.nextCount,
    });
    setConfirmRemove(null);
  };

  const isPending = setCountMutation.isPending;
  const isLoading = slotsQuery.isLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>

        {/* Required count card */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            px: 1.75,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.75,
            bgcolor: 'background.default',
            mb: 2.25,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
              Required {meta.pluralLabel}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, lineHeight: 1.3 }}>
              How many must be received for this task
            </Typography>
          </Box>
          <Stepper
            value={slots.length}
            onChange={handleStepCount}
            disabled={isPending || isLoading}
          />
        </Box>

        {/* Section label */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.25 }}>
          <Typography
            sx={{
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Slots
          </Typography>
          <Typography sx={{ ml: 'auto', fontSize: 11, color: 'text.secondary' }}>
            <SlotSummary slots={slots} filledCount={filledCount} />
          </Typography>
        </Box>

        {/* Slot list / empty state */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={16} />
          </Box>
        ) : slots.length === 0 ? (
          <EmptyState kind={kind} onSeed={(count) => setCountMutation.mutate({ organizationId, projectId, taskId, kind, count })} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {slots.map((slot, i) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                kind={kind}
                doc={docs[i] ?? null}
                members={members}
                onRename={(name) =>
                  updateSlotMutation.mutate({ organizationId, projectId, slotId: slot.id, name })
                }
                onSetDueDate={(dueDate) =>
                  updateSlotMutation.mutate({ organizationId, projectId, slotId: slot.id, dueDate })
                }
                onSetApprover={(approverId) =>
                  updateSlotMutation.mutate({ organizationId, projectId, slotId: slot.id, approverId })
                }
                onUpload={onUploadToFolder}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 2.5,
          py: 1.25,
          bgcolor: 'background.default',
        }}
      >
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Changes save automatically · close to return to the task
        </Typography>
      </Box>

      {/* Decrement confirm */}
      {confirmRemove && (
        <ConfirmRemoveDialog
          trailingFilled={confirmRemove.trailingFilled}
          kind={kind}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={confirmAndShrink}
        />
      )}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stepper
// ────────────────────────────────────────────────────────────────────────────
function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 0}
        sx={{ width: 30, height: 32, borderRadius: 0, color: 'text.secondary' }}
        aria-label="Decrease required count"
      >
        <Minus size={11} weight="bold" />
      </IconButton>
      <Box
        sx={{
          width: 38,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'divider',
          lineHeight: '32px',
        }}
      >
        {value}
      </Box>
      <IconButton
        size="small"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= 50}
        sx={{ width: 30, height: 32, borderRadius: 0, color: 'text.secondary' }}
        aria-label="Increase required count"
      >
        <Plus size={11} weight="bold" />
      </IconButton>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slot summary text
// ────────────────────────────────────────────────────────────────────────────
function SlotSummary({
  slots,
  filledCount,
}: {
  slots: { dueDate: Date | null }[];
  filledCount: number;
}) {
  const today = startOfDay(new Date());
  const overdue = slots
    .slice(filledCount) // only count *unfilled* slots as overdue
    .filter((s) => s.dueDate && isBefore(new Date(s.dueDate), today)).length;
  const pending = slots.length - filledCount;
  const parts: React.ReactNode[] = [];
  if (filledCount > 0) {
    parts.push(
      <Box key="r" component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
        {filledCount} received
      </Box>,
    );
  }
  if (overdue > 0) {
    parts.push(
      <Box key="o" component="span" sx={{ color: 'warning.main', fontWeight: 600 }}>
        {overdue} overdue
      </Box>,
    );
  }
  if (pending - overdue > 0) {
    parts.push(
      <span key="p">{pending - overdue} pending</span>,
    );
  }
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ' · ' : null}
          {part}
        </React.Fragment>
      ))}
      {parts.length === 0 ? '—' : null}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slot card
// ────────────────────────────────────────────────────────────────────────────
type SlotData = {
  id: string;
  index: number;
  name: string | null;
  dueDate: Date | null;
  approverId: string | null;
  approver: { id: string; name: string | null; email: string; image: string | null } | null;
};

type Member = {
  user: { id: string; name: string | null; email: string; image: string | null };
};

function SlotCard({
  slot,
  kind,
  doc,
  members,
  onRename,
  onSetDueDate,
  onSetApprover,
  onUpload,
}: {
  slot: SlotData;
  kind: SlotKind;
  doc: DocumentItem | null;
  members: Member[];
  onRename: (name: string | null) => void;
  onSetDueDate: (dueDate: string | null) => void;
  onSetApprover: (approverId: string | null) => void;
  onUpload: () => void;
}) {
  const meta = KIND_META[kind];
  const isReceived = !!doc;
  const isOverdue = !isReceived && slot.dueDate && isBefore(new Date(slot.dueDate), startOfDay(new Date()));

  // Local input state so typing doesn't fire a mutation per keystroke.
  const [draftName, setDraftName] = useState(slot.name ?? '');
  useEffect(() => setDraftName(slot.name ?? ''), [slot.name]);

  const commitName = () => {
    const trimmed = draftName.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    if (next === slot.name) return;
    onRename(next);
  };

  // Approver menu
  const [approverAnchor, setApproverAnchor] = useState<HTMLElement | null>(null);
  const closeApprover = () => setApproverAnchor(null);
  const handleApproverPick = (id: string | null) => {
    onSetApprover(id);
    closeApprover();
  };

  // Native date input — local state so calendar picker doesn't fire mid-edit.
  const [draftDue, setDraftDue] = useState(slot.dueDate ? toInputDate(slot.dueDate) : '');
  useEffect(() => setDraftDue(slot.dueDate ? toInputDate(slot.dueDate) : ''), [slot.dueDate]);
  const commitDue = () => {
    const next = draftDue || null;
    const current = slot.dueDate ? toInputDate(slot.dueDate) : null;
    if (next === current) return;
    onSetDueDate(next);
  };

  const cardBg = isReceived
    ? 'success.main'
    : isOverdue
      ? 'warning.main'
      : null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: isOverdue ? 'warning.main' : 'divider',
        borderRadius: '10px',
        px: 1.75,
        py: 1.5,
        bgcolor: 'background.paper',
        position: 'relative',
        // Subtle tint for received/overdue states without losing the white surface
        backgroundImage: cardBg
          ? `linear-gradient(0deg, var(--mui-palette-background-paper, #fff), var(--mui-palette-background-paper, #fff))`
          : 'none',
        '&::before': cardBg ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '10px',
          bgcolor: cardBg,
          opacity: 0.05,
          pointerEvents: 'none',
        } : undefined,
        transition: 'border-color 0.15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25, position: 'relative' }}>
        <SlotNumberBadge index={slot.index} kind={kind} isReceived={isReceived} />
        <SlotNameInput
          value={draftName}
          onChange={setDraftName}
          onCommit={commitName}
          placeholder={`Name this ${meta.label}…`}
          color={meta.color}
        />
        <SlotStatusPill received={isReceived} overdue={!!isOverdue} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, position: 'relative' }}>
        <FieldSlot label="Due date">
          <Box
            component="input"
            type="date"
            value={draftDue}
            onChange={(e) => setDraftDue(e.target.value)}
            onBlur={commitDue}
            sx={{
              fontFamily: 'inherit',
              fontSize: 12,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '6px',
              bgcolor: 'background.default',
              color: isOverdue ? 'warning.main' : 'text.primary',
              px: 1,
              py: 0.75,
              outline: 'none',
              width: '100%',
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: 'text.disabled' },
              '&:focus': { borderColor: meta.color },
            }}
          />
        </FieldSlot>
        <FieldSlot label="Approver">
          <Box
            component="button"
            onClick={(e) => setApproverAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              fontFamily: 'inherit',
              fontSize: 12,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '6px',
              bgcolor: 'background.default',
              color: slot.approver ? 'text.primary' : 'text.disabled',
              px: 1,
              py: 0.75,
              cursor: 'pointer',
              width: '100%',
              minWidth: 0,
              textAlign: 'left',
              '&:hover': { borderColor: 'text.disabled' },
            }}
          >
            {slot.approver ? (
              <>
                <Avatar
                  src={slot.approver.image ?? undefined}
                  sx={{ width: 18, height: 18, fontSize: 9, fontWeight: 600 }}
                >
                  {(slot.approver.name ?? slot.approver.email).charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {slot.approver.name ?? slot.approver.email}
                </Box>
              </>
            ) : (
              <>
                <UserCircle size={14} />
                <span>Assign…</span>
              </>
            )}
          </Box>
        </FieldSlot>
      </Box>

      {/* Footer: file info or upload CTA */}
      <Box
        sx={{
          mt: 1.25,
          pt: 1.25,
          borderTop: '1px dashed',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: 11,
          position: 'relative',
        }}
      >
        {isReceived ? (
          <>
            <CheckCircle size={13} weight="fill" color="var(--mui-palette-success-main, #16a34a)" />
            <Box sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}>
              {doc.name}
            </Box>
            <Box sx={{ color: 'text.secondary', flexShrink: 0 }}>
              {doc.createdAt ? format(new Date(doc.createdAt), 'MMM d') : ''}
            </Box>
          </>
        ) : (
          <Box
            component="button"
            onClick={onUpload}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 500,
              color: meta.color,
              p: 0,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <CloudArrowUp size={13} />
            {meta.uploadCta}
          </Box>
        )}
      </Box>

      {/* Approver picker menu */}
      <Menu
        anchorEl={approverAnchor}
        open={!!approverAnchor}
        onClose={closeApprover}
        slotProps={{
          paper: {
            sx: { minWidth: 220, maxHeight: 320, mt: 0.5, borderRadius: '10px' },
          },
        }}
      >
        {slot.approverId && (
          <MenuItem onClick={() => handleApproverPick(null)} sx={{ fontSize: 12, color: 'error.main' }}>
            <Trash size={14} style={{ marginRight: 8 }} />
            Clear approver
          </MenuItem>
        )}
        {members.length === 0 ? (
          <MenuItem disabled sx={{ fontSize: 12 }}>No members in this org</MenuItem>
        ) : (
          members.map((m) => (
            <MenuItem
              key={m.user.id}
              onClick={() => handleApproverPick(m.user.id)}
              selected={m.user.id === slot.approverId}
              sx={{ fontSize: 12, gap: 1 }}
            >
              <Avatar
                src={m.user.image ?? undefined}
                sx={{ width: 22, height: 22, fontSize: 10, fontWeight: 600 }}
              >
                {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Box sx={{ fontWeight: 500, lineHeight: 1.2 }}>{m.user.name ?? m.user.email}</Box>
                {m.user.name && (
                  <Box sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.2 }}>{m.user.email}</Box>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}

function SlotNumberBadge({
  index,
  kind,
  isReceived,
}: {
  index: number;
  kind: SlotKind;
  isReceived: boolean;
}) {
  const meta = KIND_META[kind];
  const bg = isReceived ? 'var(--mui-palette-success-main, #16a34a)' : `${meta.color}1F`;
  const color = isReceived ? '#fff' : meta.color;
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        bgcolor: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {isReceived ? <CheckCircle size={12} weight="fill" /> : index + 1}
    </Box>
  );
}

function SlotNameInput({
  value,
  onChange,
  onCommit,
  placeholder,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  placeholder: string;
  color: string;
}) {
  return (
    <Box
      component="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      placeholder={placeholder}
      sx={{
        flex: 1,
        minWidth: 0,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px dashed transparent',
        outline: 'none',
        color: 'text.primary',
        py: 0.5,
        '&::placeholder': { color: 'text.disabled', fontStyle: 'italic' },
        '&:hover': { borderBottomColor: 'divider' },
        '&:focus': { borderBottomColor: color },
      }}
    />
  );
}

function FieldSlot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 9,
          fontWeight: 600,
          color: 'text.disabled',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function SlotStatusPill({ received, overdue }: { received: boolean; overdue: boolean }) {
  const config = received
    ? { label: 'Received', bg: 'rgba(22,163,74,0.14)', color: 'success.main' }
    : overdue
      ? { label: 'Overdue', bg: 'rgba(217,119,6,0.14)', color: 'warning.main' }
      : { label: 'Pending', bg: 'action.selected', color: 'text.secondary' };
  return (
    <Box
      sx={{
        fontSize: 10,
        fontWeight: 600,
        px: 0.875,
        py: '2px',
        borderRadius: '999px',
        bgcolor: config.bg,
        color: config.color,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {config.label}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state with quick-seed buttons
// ────────────────────────────────────────────────────────────────────────────
function EmptyState({
  kind,
  onSeed,
}: {
  kind: SlotKind;
  onSeed: (count: number) => void;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const presets = [1, 3, 5];
  return (
    <Box
      sx={{
        border: '1.5px dashed',
        borderColor: 'divider',
        borderRadius: '12px',
        px: 2.5,
        py: 4,
        textAlign: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.25,
          color: 'text.disabled',
        }}
      >
        <Icon size={20} />
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
        No {meta.pluralLabel} required
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
        Use the stepper above, or pick a starting count below.
      </Typography>
      <Box sx={{ display: 'inline-flex', gap: 0.75 }}>
        {presets.map((n) => (
          <Box
            key={n}
            component="button"
            onClick={() => onSeed(n)}
            sx={{
              px: 1.25,
              py: 0.625,
              borderRadius: '7px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              color: 'text.primary',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              '&:hover': { borderColor: meta.color, color: meta.color },
            }}
          >
            {n} {n === 1 ? meta.label : meta.pluralLabel}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Confirm dialog for destructive shrink
// ────────────────────────────────────────────────────────────────────────────
function ConfirmRemoveDialog({
  trailingFilled,
  kind,
  onCancel,
  onConfirm,
}: {
  trailingFilled: number;
  kind: SlotKind;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const meta = KIND_META[kind];
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'rgba(0,0,0,0.32)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
      }}
      onClick={onCancel}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 360,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          p: 2.25,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              bgcolor: 'rgba(217,119,6,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarningCircle size={18} color="var(--mui-palette-warning-main, #d97706)" weight="fill" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Remove filled slot?</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
              {trailingFilled === 1 ? '1 slot has' : `${trailingFilled} slots have`} an uploaded {meta.label}.
              Removing will detach the file{trailingFilled === 1 ? '' : 's'} from the slot but keep
              {trailingFilled === 1 ? ' it' : ' them'} in the project's library.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Box
            component="button"
            onClick={onCancel}
            sx={{
              px: 1.5, py: 0.875,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </Box>
          <Box
            component="button"
            onClick={onConfirm}
            sx={{
              px: 1.5, py: 0.875,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'warning.main',
              bgcolor: 'warning.main',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { filter: 'brightness(0.95)' },
            }}
          >
            Remove
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function toInputDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'yyyy-MM-dd');
}
